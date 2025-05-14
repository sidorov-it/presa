/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client';

import React, { useState, useRef, useCallback, memo, useMemo, MutableRefObject } from 'react';
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
import { useDndStore } from '@/store/dndStore';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

interface SlideEditorProps {
    slideLayoutIds: string[];
    presentationId: string;
    isSelected: boolean;
    tiptapRefs: MutableRefObject<TipTapRefs>;
    slideId: string;
    handleSelectSlide: (slideId: string) => void;
}

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
    const openMenu = useMenuStore.getState().openMenu;

    const isReadOnly = useReadOnly();

    const backgroundType = usePresentationStore(state => state.getSlide(presentationId, slideId)?.background?.type);
    const backgroundValue = usePresentationStore(state => state.getSlide(presentationId, slideId)?.background?.value);
    const textColor = usePresentationStore(state => state.getSlide(presentationId, slideId)?.textColor);

    const contentAlignment = usePresentationStore(state => state.getSlide(presentationId, slideId)?.contentAlignment);
    const imageSize = usePresentationStore(state => state.getSlide(presentationId, slideId)?.imageSize);
    const templateType = usePresentationStore(state => state.getSlide(presentationId, slideId)?.templateType);
    const imageUrl = usePresentationStore(state => state.getSlide(presentationId, slideId)?.imageUrl);

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
        const style: React.CSSProperties & Record<string, string> = {};

        if (templateType === 'imageBackground' && imageUrl) {
            style.backgroundImage = `url(${imageUrl})`;
        }

        // Use background color from slide data
        if (backgroundType === 'color') {
            style.backgroundColor = backgroundValue;
        }

        if (textColor) {
            style['--presentation-text-color'] = textColor;
            style['--presentation-heading-color'] = textColor;
        }

        return style;
    }, [imageUrl, templateType, backgroundType, backgroundValue, textColor]);

    const getSlideClassName = useCallback(() => {
        let className = styles.slideWrapper;
        if (isSelected && !isReadOnly) {
            className += ` ${styles.slideSelected}`;
        }
        return className;
    }, [isSelected, isReadOnly]);

    const slideMenuOpen = useMenuStore(state => state.checkSlideMenuIsOpen(slideId));

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
            if (isReadOnly) {
                return;
            }

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
        if (!templateType) return {};

        const baseStyle: React.CSSProperties = {
            // backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        };

        if (imageUrl) {
            baseStyle.backgroundImage = `url(${imageUrl})`;
        }

        switch (templateType) {
            case 'imageTop':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '33%',
                    maxHeight: '200px',
                    zIndex: 1,
                };
            case 'imageLeft':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '20%',
                    zIndex: 1,
                    maxWidth: '50%',
                };
            case 'imageRight':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '20%',
                    zIndex: 1,
                    maxWidth: '50%',
                };
            case 'imageBackground':
                // This is handled by slide background
                return {};
            default:
                return {};
        }
    }, [templateType, imageUrl]);

    // Calculate content style for layouts based on template
    const contentStyle: React.CSSProperties = useMemo(() => {
        // Base styles
        const baseStyle: React.CSSProperties = {
            position: 'relative',
            height: '100%',
            width: '100%',
        };

        // Apply content alignment
        if (contentAlignment) {
            baseStyle.display = 'flex';
            baseStyle.flexDirection = 'column';
            switch (contentAlignment) {
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
        if (templateType) {
            // Get stored image size or use default values
            let imageWidth = imageSize?.width || 'min(50%, 300px)';
            if (parseInt(imageWidth, 10) > 50) {
                imageWidth = '50%';
            }

            const imageHeight = imageSize?.height || 'min(50%, 300px)';
            const remainingWidth = `${100 - parseFloat(imageWidth)}%`;
            const remainingHeight = `${100 - parseFloat(imageHeight)}%`;

            switch (templateType) {
                case 'imageTop':
                    return {
                        ...baseStyle,
                        position: 'relative',
                        zIndex: 2,
                        paddingTop: imageHeight,
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
                case 'imageBackground':
                    return {
                        ...baseStyle,
                        position: 'relative',
                        zIndex: 2,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundImage: `url(${imageUrl})`,
                    };
                default:
                    return baseStyle;
            }
        }

        return baseStyle;
    }, [contentAlignment, templateType, imageSize?.width, imageSize?.height, imageUrl]);

    // Add useDnd hook
    const { handleDragStart } = useDnd();

    const isDropTarget = useDndStore(({ state }) => state.indicators.slideIndicator === slideId);
    const isDragging = useDndStore(({ state }) => state.dragState === 'dragging' && state.source.slideId === slideId);
    // Добавляем проверку на активный индикатор для слайда
    // const isDropTarget = state.indicators.slideIndicator === slideId;

    return (
        <div
            className={`${styles.slide} ${isDropTarget ? 'active-slide-drop-target' : ''}`}
            onClick={handleSlideWrapperClick}
            onMouseEnter={() => !isReadOnly && setIsHovered(true)}
            onMouseLeave={() => !isReadOnly && setIsHovered(false)}
            aria-label={`Slide ${slideId}`}
            onKeyDown={e => {
                if (!isReadOnly && (e.key === 'Enter' || e.key === ' ')) {
                    handleSlideWrapperClick(e as unknown as React.MouseEvent);
                }
            }}
            data-slide-dragging={isDragging ? 'true' : undefined}
        >
            <div className={`${getSlideClassName()}`} style={getSlideStyle()} data-slide="true">
                <div className={`${styles.slideBorder} ${isSelected || isHovered ? styles.slideBorderMenuOpen : ''}`} />
                <div
                    ref={editorRef}
                    className={`${styles.slideContent}`}
                    data-slide-content="true"
                    style={getSlideStyle()}
                >
                    {(isSelected || slideMenuOpen || isHovered) && !isReadOnly && (
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
                                    handleDragStart(e, { elementId: null, slideId, dragElementType: 'slide' });
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
                    {imageStyle && templateType && (
                        <ResizableTemplateImage
                            presentationId={presentationId}
                            slideId={slideId}
                            templateType={templateType}
                            imageUrl={imageUrl}
                            initialImageStyle={imageStyle}
                        />
                    )}

                    <div
                        className={styles.slideContainer}
                        data-slide-id={slideId}
                        data-slide-container="true"
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

                {!isReadOnly && (
                    <div
                        className={`${styles.slideDivider} ${isSelected || isHovered ? styles.slideDividerHovered : ''}`}
                    >
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
                )}
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
