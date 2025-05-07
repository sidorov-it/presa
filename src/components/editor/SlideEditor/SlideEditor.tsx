/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client';

import React, { useState, useRef, RefObject, useCallback, memo, useMemo } from 'react';
import { getPredefinedGridStructures, Layout, TipTapRefs } from '@/types';
import { PresentationState, usePresentationStore } from '@/store/presentationStore';
import styles from './SlideEditor.module.css';
import LayoutContent from '../LayoutContent/LayoutContent';
import { DragDropTransactionHelper } from '@/contexts/DragDropTransactionHelper';
import DragHandler from '../DragHandler';
import TemplateButton from '../TemplateButton/TemplateButton';
import ResizableTemplateImage from '../ResizableTemplateImage';
import { getNewEditorElement } from '@/elements/registry';
import { useMenuStore } from '@/store/menuStore';
import deepEqual from 'deep-equal';
import { useDnd } from '@/contexts/DragDropContext';
import { TEXT_ELEMENT_TYPES } from '@/elements/menuRegistry';

interface SlideEditorProps {
    slideLayoutIds: string[];
    presentationId: string;
    isSelected: boolean;
    tiptapRefs: RefObject<TipTapRefs>;
    slideId: string;
    slideNumber: number;
    handleSelectSlide: (slideId: string) => void;
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
    slideNumber,
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const openMenu = useMenuStore.getState().openMenu;
    const checkSlideMenuIsOpen = useMenuStore.getState().checkSlideMenuIsOpen;

    // Get slide data to access template properties
    const slide = usePresentationStore(
        useCallback(state => state.getSlide(presentationId, slideId), [presentationId, slideId])
    );

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

    const getSlideStyle = useCallback(() => {
        if (slide?.templateType === 'imageBackground') {
            return {
                ...(slide?.imageUrl ? { backgroundImage: `url(${slide.imageUrl})` } : {}),
            };
        }

        // Use background color from slide data
        if (slide?.background?.type === 'color') {
            return {
                backgroundColor: slide.background.value,
            };
        }

        return {};
    }, [slide?.imageUrl, slide?.templateType, slide?.background]);

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
            const slide = usePresentationStore.getState().getSlide(presentationId, slideId)!;

            const lastLayout = slide?.layouts[slide?.layouts.length - 1];

            const lastLayoutDomElement = document.querySelector(`[data-layout-id="${lastLayout.id}"]`);
            const bottomBorderPosition = lastLayoutDomElement!.getBoundingClientRect().bottom;
            const clickPosition = e.clientY;

            const element = lastLayout.elements[0];

            if (clickPosition > bottomBorderPosition) {
                if (
                    lastLayout?.elements.length === 1 &&
                    TEXT_ELEMENT_TYPES.includes(element.elementTypeId) &&
                    tiptapRefs.current?.editors[lastLayout.elements[0].id]
                ) {
                    tiptapRefs.current?.editors[lastLayout.elements[0].id]?.editor.chain().focus().run();
                    return;
                }

                createDefaultLayout();
            }
        },
        [tiptapRefs, createDefaultLayout, presentationId, slideId]
    );

    // Image rendering based on template type
    const imageStyle: React.CSSProperties = useMemo(() => {
        if (!slide?.templateType) return {};

        const baseStyle: React.CSSProperties = {
            // backgroundImage: `url(${slide.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        };

        if (slide.imageUrl) {
            baseStyle.backgroundImage = `url(${slide.imageUrl})`;
        }

        switch (slide.templateType) {
            case 'imageTop':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '33%',
                    zIndex: 1,
                };
            case 'imageBottom':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '33%',
                    zIndex: 1,
                };
            case 'imageLeft':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '33%',
                    zIndex: 1,
                };
            case 'imageRight':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '33%',
                    zIndex: 1,
                };
            case 'imageBackground':
                // This is handled by slide background
                return {};
            default:
                return {};
        }
    }, [slide?.templateType, slide?.imageUrl]);

    // Calculate content style for layouts based on template
    const contentStyle: React.CSSProperties = useMemo(() => {
        if (!slide) return {};

        // Base styles
        const baseStyle: React.CSSProperties = {
            position: 'relative',
            height: '100%',
            width: '100%',
        };

        // Apply content alignment
        if (slide.contentAlignment) {
            baseStyle.display = 'flex';
            baseStyle.flexDirection = 'column';
            switch (slide.contentAlignment) {
                case 'top':
                    baseStyle.justifyContent = 'flex-start';
                    break;
                case 'center':
                    baseStyle.justifyContent = 'center';
                    break;
                case 'bottom':
                    baseStyle.justifyContent = 'flex-end';
                    break;
                default:
                    baseStyle.justifyContent = 'center'; // Default to center
            }
        }

        // Additional styles for image templates
        if (slide.templateType) {
            // Get stored image size or use default values
            const imageWidth = slide.imageSize?.width || '33%';
            const imageHeight = slide.imageSize?.height || '33%';
            const remainingWidth = `${100 - parseFloat(imageWidth)}%`;
            const remainingHeight = `${100 - parseFloat(imageHeight)}%`;

            switch (slide.templateType) {
                case 'imageTop':
                    return {
                        ...baseStyle,
                        position: 'relative',
                        zIndex: 2,
                        paddingTop: imageHeight,
                        height: remainingHeight,
                    };
                case 'imageBottom':
                    return {
                        ...baseStyle,
                        position: 'relative',
                        zIndex: 2,
                        paddingBottom: imageHeight,
                        height: remainingHeight,
                    };
                case 'imageLeft':
                    return {
                        ...baseStyle,
                        position: 'relative',
                        zIndex: 2,
                        marginLeft: imageWidth,
                        width: remainingWidth,
                    };
                case 'imageRight':
                    return {
                        ...baseStyle,
                        position: 'relative',
                        zIndex: 2,
                        width: remainingWidth,
                    };
                default:
                    return baseStyle;
            }
        }

        return baseStyle;
    }, [slide]);

    // Add useDnd hook
    const { state, handleDragStart } = useDnd();

    // Добавляем проверку на активный индикатор для слайда
    const isDropTarget = state.indicators.slideIndicator === slideId;

    return (
        <div
            className={`${styles.slide} ${isDropTarget ? 'active-slide-drop-target' : ''}`}
            onClick={handleSlideWrapperClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={`Slide ${slideId}`}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleSlideWrapperClick(e as unknown as React.MouseEvent);
                }
            }}
            data-slide-dragging={
                state?.dragState === 'dragging' && state.source.slideId === slideId ? 'true' : undefined
            }
        >
            <div className={`${getSlideClassName()}`} style={getSlideStyle()}>
                <div className={`${styles.slideBorder} ${isSelected || isHovered ? styles.slideBorderMenuOpen : ''}`} />
                <div ref={editorRef} className={`${styles.slideContent}`} style={{}}>
                    {(isSelected || slideMenuOpen || isHovered) && (
                        <>
                            <DragHandler
                                className={styles.slideDragHandle}
                                slideId={slideId}
                                isActive={slideMenuOpen}
                                ariaLabel="Drag or open slide menu"
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
                                    // Start slide drag instead of preventing default
                                    handleDragStart(e, { elementId: null, slideId });
                                }}
                            />
                            <TemplateButton
                                presentationId={presentationId}
                                slideId={slideId}
                                isHovered={isHovered}
                                isSelected={isSelected}
                                tiptapRefs={tiptapRefs}
                            />
                        </>
                    )}

                    {/* Template image if needed */}
                    {imageStyle && slide?.templateType && (
                        <ResizableTemplateImage
                            presentationId={presentationId}
                            slideId={slideId}
                            templateType={slide.templateType}
                            imageUrl={slide.imageUrl}
                            initialImageStyle={imageStyle}
                        />
                    )}

                    <div
                        className={styles.slideContainer}
                        data-slide-id={slideId}
                        onClick={handleSlideClick}
                        style={contentStyle}
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
                </div>

                <div className={`${styles.slideDivider} ${isSelected || isHovered ? styles.slideDividerHovered : ''}`}>
                    <div className={styles.buttons}>
                        <button
                            className={styles.slideDividerButton}
                            onClick={handleAddSlideAfter}
                            aria-label="Добавить слайд"
                        >
                            +
                        </button>
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
