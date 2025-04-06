/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client'

import React, { useState, useRef, RefObject, useCallback, memo } from 'react';
import { getPredefinedGridStructures, Layout, Slide, TipTapRefs, PresentationState } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import styles from './SlideEditor.module.css';
import LayoutContent from '../LayoutContent/LayoutContent';
import { useSlideMenu } from '@/contexts/SlideMenuContext';
import { DragDropTransactionHelper } from '@/contexts/DragDropTransactionHelper';
import DragHandler from '../DragHandler';
import { getNewEditorElement } from '@/elements/registry';

interface SlideEditorProps {
    slide: Slide;
    presentationId: string;
    handleSelectSlide: (slideId: string) => void;
    isSelected: boolean;
    tiptapRefs: RefObject<TipTapRefs>;
}

export const getColumnWidths = (columnsCount: number): string[] => {
    if (columnsCount === 0) {
        return [];
    } else if (columnsCount === 3) {
        return ['33%', '34%', '33%'];
    } else {
        return new Array(columnsCount).fill(`${100 / columnsCount}%`);
    }
}

const SlideEditor: React.FC<SlideEditorProps> = ({
    slide,
    tiptapRefs,
    presentationId,
    handleSelectSlide,
    isSelected,
}) => {
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Use selector that only gets the specific needed function using a factory
    const addSlideSelector = useCallback((state: PresentationState) => state.addSlide, []);
    const addSlide = usePresentationStore(addSlideSelector);

    const { openMenu, checkSlideMenuIsOpen } = useSlideMenu();

    // Memoize handlers to prevent re-renders
    const handleSelectElement = useCallback((elementId: string) => {
        setSelectedElementId(elementId);
    }, []);

    const handleDeleteElement = useCallback((layoutId: string, elementId: string) => {
        // Use getState to access the store without subscribing to it
        usePresentationStore.getState().deleteElement(presentationId, slide.id, layoutId, elementId);
        if (selectedElementId === elementId) {
            setSelectedElementId(null);
        }
    }, [presentationId, slide.id, selectedElementId]);

    const handleAddSlideAfter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        // Create a selector to get just the slide index
        const getSlideIndex = usePresentationStore.getState().getSlideIndex;
        const slideIndex = getSlideIndex(presentationId, slide.id);

        if (slideIndex !== -1) {
            const newSlideIndex = slideIndex + 1;
            addSlide(presentationId, newSlideIndex);
        }
    }, [presentationId, slide.id, addSlide]);

    const handleOpenSlideMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        openMenu({
            slideId: slide.id,
            elementId: null,
            elementType: 'slide'
        });
        handleSelectSlide(slide.id);
    }, [slide.id, openMenu, handleSelectSlide]);

    const getSlideClassName = useCallback(() => {
        let className = styles.slideWrapper;
        if (isSelected) {
            className += ` ${styles.slideSelected}`;
        }
        return className;
    }, [isSelected]);

    const slideMenuOpen = checkSlideMenuIsOpen(slide.id);

    const handleSlideWrapperClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        handleSelectSlide(slide.id);

        const handleDocumentClick = (event: MouseEvent) => {
            if (event.target instanceof HTMLElement &&
                !event.target.closest('[data-slide-id]') &&
                event.target.getAttribute('data-slide-drag-handle') !== slide.id) {
                document.removeEventListener('click', handleDocumentClick);
            }
        };

        document.addEventListener('click', handleDocumentClick);
        return () => {
            document.removeEventListener('click', handleDocumentClick);
        };
    }, [slide.id, handleSelectSlide]);

    const handleSlideClick = useCallback((e: React.MouseEvent) => {
        const rect = editorRef.current?.getBoundingClientRect();
        if (rect) {
            const positionY = e.clientY - (rect.top ?? 0);
            const slideHeight = rect.height ?? 0;
            const isClickBottom = slideHeight - positionY < 30;

            if (isClickBottom) {
                createDefaultLayout();
            }
        }
    }, []);

    // Create default layout with a single editor
    const createDefaultLayout = useCallback(() => {
        const gridStructure = getPredefinedGridStructures('single-column');
        const cellId = gridStructure.rows[0].cells[0].id;

        const editorElement = getNewEditorElement(cellId);

        const newLayout: Omit<Layout, 'id'> = {
            type: 'single-column',
            elements: [editorElement],
            style: {},
            gridStructure
        };

        DragDropTransactionHelper.addLayout(presentationId, slide.id, newLayout, slide.layouts.length);

        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('focus_editor', {
                bubbles: true,
                cancelable: true,
                detail: { editorId: editorElement.id }
            }));
        }, 100);
    }, [presentationId, slide.id]);

    return (
        <div
            className={`${styles.slide}`}
            onClick={handleSlideWrapperClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="button"
            tabIndex={0}
            aria-label={`Slide ${slide.id}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleSlideWrapperClick(e as unknown as React.MouseEvent);
                }
            }}
        >
            <div className={`${getSlideClassName()} themed-slide`}>
                <div className={`${styles.slideBorder} ${isSelected || isHovered ? styles.slideBorderMenuOpen : ''}`} />
                <div
                    ref={editorRef}
                    className={`${styles.slideContent} themed-card`}
                    style={{}}
                >
                    {(isSelected || slideMenuOpen || isHovered) && (
                        <DragHandler
                            className={styles.slideDragHandle}
                            slideId={slide.id}
                            isActive={slideMenuOpen}
                            ariaLabel="Открыть меню слайда"
                            dataAttributes={{
                                'data-slide-drag-handle': slide.id,
                            }}
                            handleClick={handleOpenSlideMenu}
                            handleKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleOpenSlideMenu(e as unknown as React.MouseEvent<HTMLDivElement>);
                                }
                            }}
                            handleDragStart={(e) => {
                                e.preventDefault();
                            }}
                        />
                    )}

                    <div className={`${styles.slideContainer} themed-card`} data-slide-id={slide.id} onClick={handleSlideClick}>
                        {slide.layouts.map((layout: Layout) => (
                            <LayoutContent
                                key={layout.id}
                                layout={layout}
                                onSelectElement={handleSelectElement}
                                onDeleteElement={handleDeleteElement}
                                tiptapRefs={tiptapRefs}
                                presentationId={presentationId}
                                slideId={slide.id}
                            />
                        ))}
                    </div>

                    <div className={`${styles.slideDivider} ${isSelected || isHovered ? styles.slideDividerHovered : ''}`}>
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
    const prevLayouts = prevProps.slide.layouts;
    const nextLayouts = nextProps.slide.layouts;

    const layoutsEqual = prevLayouts.length === nextLayouts.length &&
                         prevLayouts.every((layout, index) =>
                             JSON.stringify(layout) === JSON.stringify(nextLayouts[index]));

    return layoutsEqual &&
           prevProps.isSelected === nextProps.isSelected &&
           prevProps.presentationId === nextProps.presentationId &&
           prevProps.slide.id === nextProps.slide.id;
});