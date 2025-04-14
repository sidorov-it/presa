/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client';

import React, { useState, useRef, RefObject, useCallback, memo } from 'react';
import { getPredefinedGridStructures, Layout, TipTapRefs } from '@/types';
import { PresentationState, usePresentationStore } from '@/store/presentationStore';
import styles from './SlideEditor.module.css';
import LayoutContent from '../LayoutContent/LayoutContent';
import { DragDropTransactionHelper } from '@/contexts/DragDropTransactionHelper';
import DragHandler from '../DragHandler';
import { getNewEditorElement } from '@/elements/registry';
import { useMenuStore } from '@/store/menuStore';
import { useEditorStore } from '@/store/editorStore';
import deepEqual from 'deep-equal';

interface SlideEditorProps {
    slideLayoutIds: string[];
    presentationId: string;
    handleSelectSlide: (slideId: string) => void;
    isSelected: boolean;
    tiptapRefs: RefObject<TipTapRefs>;
    slideId: string;
}

interface ColumnWidthOptions {
    columnIndex: number;
    width: number;
}

export const getColumnWidths = (columnsCount: number, options?: ColumnWidthOptions): string[] => {
    if (columnsCount === 0) {
        return [];
    }

    if (options) {
        const { columnIndex, width } = options;
        if (columnIndex >= columnsCount) {
            throw new Error('Column index is out of bounds');
        }

        const remainingColumns = columnsCount - 1;
        const remainingWidth = 100 - width;
        const equalWidth = `${remainingWidth / remainingColumns}%`;

        return Array.from({ length: columnsCount }, (_, index) => (index === columnIndex ? `${width}%` : equalWidth));
    }

    if (columnsCount === 3) {
        return ['33%', '34%', '33%'];
    }

    return new Array(columnsCount).fill(`${100 / columnsCount}%`);
};

const SlideEditor: React.FC<SlideEditorProps> = ({
    slideLayoutIds,
    slideId,
    tiptapRefs,
    presentationId,
    handleSelectSlide,
    isSelected,
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const menuElementId = useMenuStore(state => state.elementId);
    const { activeEditor } = useEditorStore();

    const openMenu = useMenuStore.getState().openMenu;
    const checkSlideMenuIsOpen = useMenuStore.getState().checkSlideMenuIsOpen;

    // Use selector that only gets the specific needed function using a factory
    const addSlideSelector = useCallback((state: PresentationState) => state.addSlide, []);
    const addSlide = usePresentationStore(addSlideSelector);

    const handleDeleteElement = useCallback(
        (layoutId: string, elementId: string) => {
            // Use getState to access the store without subscribing to it
            usePresentationStore.getState().deleteElement(presentationId, slideId, layoutId, elementId);
        },
        [presentationId, slideId]
    );

    const handleAddSlideAfter = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();

            // Create a selector to get just the slide index
            const getSlideIndex = usePresentationStore.getState().getSlideIndex;
            const slideIndex = getSlideIndex(presentationId, slideId);

            if (slideIndex !== -1) {
                const newSlideIndex = slideIndex + 1;
                addSlide(presentationId, newSlideIndex);
            }
        },
        [presentationId, slideId, addSlide]
    );

    const handleOpenSlideMenu = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            openMenu({
                slideId: slideId,
                elementId: null,
                elementType: 'slide',
            });
            handleSelectSlide(slideId);
        },
        [slideId, openMenu, handleSelectSlide]
    );

    const getSlideClassName = useCallback(() => {
        let className = styles.slideWrapper;
        if (isSelected) {
            className += ` ${styles.slideSelected}`;
        }
        return className;
    }, [isSelected]);

    const slideMenuOpen = checkSlideMenuIsOpen(slideId);

    const handleSlideWrapperClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            handleSelectSlide(slideId);

            const handleDocumentClick = (event: MouseEvent) => {
                if (
                    event.target instanceof HTMLElement &&
                    !event.target.closest('[data-slide-id]') &&
                    event.target.getAttribute('data-slide-drag-handle') !== slideId
                ) {
                    document.removeEventListener('click', handleDocumentClick);
                }
            };

            document.addEventListener('click', handleDocumentClick);
            return () => {
                document.removeEventListener('click', handleDocumentClick);
            };
        },
        [slideId, handleSelectSlide]
    );

    const createDefaultLayout = useCallback(() => {
        const gridStructure = getPredefinedGridStructures('single-column');
        const cellId = gridStructure.rows[0].cells[0].id;

        const editorElement = getNewEditorElement(cellId);

        const newLayout: Omit<Layout, 'id'> = {
            type: 'single-column',
            elements: [editorElement],
            style: {},
            gridStructure,
        };

        DragDropTransactionHelper.addLayout(presentationId, slideId, newLayout, slideLayoutIds.length);

        setTimeout(() => {
            document.dispatchEvent(
                new CustomEvent('focus_editor', {
                    bubbles: true,
                    cancelable: true,
                    detail: { editorId: editorElement.id },
                })
            );
        }, 100);
    }, [presentationId, slideId, slideLayoutIds]);

    const handleSlideClick = useCallback(
        (e: React.MouseEvent) => {
            if (slideLayoutIds.length === 1 && !menuElementId && !activeEditor) {
                const layoutId = slideLayoutIds[0];
                const layout = usePresentationStore.getState().getLayout(presentationId, slideId, layoutId);
                if (layout?.elements.length === 1 && tiptapRefs.current?.editors[layout.elements[0].id]) {
                    tiptapRefs.current?.editors[layout.elements[0].id]?.editor.chain().focus().run();
                    return;
                }
            }

            const rect = editorRef.current?.getBoundingClientRect();
            if (rect) {
                const positionY = e.clientY - (rect.top ?? 0);
                const slideHeight = rect.height ?? 0;
                const isClickBottom = slideHeight - positionY < 30;

                if (isClickBottom) {
                    createDefaultLayout();
                }
            }
        },
        [slideLayoutIds, menuElementId, activeEditor, tiptapRefs, createDefaultLayout, presentationId, slideId]
    );

    return (
        <div
            className={`${styles.slide}`}
            onClick={handleSlideWrapperClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="button"
            tabIndex={0}
            aria-label={`Slide ${slideId}`}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleSlideWrapperClick(e as unknown as React.MouseEvent);
                }
            }}
        >
            <div className={`${getSlideClassName()} themed-slide`}>
                <div className={`${styles.slideBorder} ${isSelected || isHovered ? styles.slideBorderMenuOpen : ''}`} />
                <div ref={editorRef} className={`${styles.slideContent} themed-card`} style={{}}>
                    {(isSelected || slideMenuOpen || isHovered) && (
                        <DragHandler
                            className={styles.slideDragHandle}
                            slideId={slideId}
                            isActive={slideMenuOpen}
                            ariaLabel="Открыть меню слайда"
                            dataAttributes={{
                                'data-slide-drag-handle': slideId,
                            }}
                            handleClick={handleOpenSlideMenu}
                            handleKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleOpenSlideMenu(e as unknown as React.MouseEvent<HTMLDivElement>);
                                }
                            }}
                            handleDragStart={e => {
                                e.preventDefault();
                            }}
                        />
                    )}

                    <div
                        className={`${styles.slideContainer} themed-card`}
                        data-slide-id={slideId}
                        onClick={handleSlideClick}
                    >
                        {slideLayoutIds.map((layoutId: string) => (
                            <LayoutContent
                                key={layoutId}
                                layoutId={layoutId}
                                onDeleteElement={handleDeleteElement}
                                tiptapRefs={tiptapRefs}
                                presentationId={presentationId}
                                slideId={slideId}
                            />
                        ))}
                    </div>

                    <div
                        className={`${styles.slideDivider} ${isSelected || isHovered ? styles.slideDividerHovered : ''}`}
                    >
                        <div className={styles.buttons}>
                            <button
                                className={`${styles.slideDividerButton} themed-button`}
                                onClick={handleAddSlideAfter}
                                aria-label="Добавить слайд"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Enhanced memo comparison to perform deep comparison of relevant slide properties
export default memo(SlideEditor, (prevProps, nextProps) => {
    // Deep compare the slide layouts to ensure we only re-render when layouts change
    // const prevLayouts = prevProps.slideLayoutsLength;
    // const nextLayouts = nextProps.slideLayoutsLength;

    // const layoutsEqual = prevLayouts.length === nextLayouts.length &&
    //     prevLayouts.every((layout, index) =>
    //         JSON.stringify(layout) === JSON.stringify(nextLayouts[index]));

    return (
        deepEqual(prevProps.slideLayoutIds, nextProps.slideLayoutIds) &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.presentationId === nextProps.presentationId &&
        prevProps.slideId === nextProps.slideId
    );
});
