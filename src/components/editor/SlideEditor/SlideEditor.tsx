/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client';

import React, { useState, useRef, useCallback, memo, useMemo, MutableRefObject, useEffect } from 'react';
import { TipTapRefs } from '@/types';
import { PresentationState, usePresentationStore } from '@/store/presentationStore';
import styles from './SlideEditor.module.css';
import LayoutContent from '../LayoutContent/LayoutContent';
import DragHandler from '../DragHandler';
import TemplateButton from '../TemplateButton/TemplateButton';
import AIEditButton from '../AIEditButton/AIEditButton';
import ResizableTemplateImage from '../ResizableTemplateImage';
import { useMenuStore } from '@/store/menuStore';
import deepEqual from 'deep-equal';
import { useDnd } from '@/contexts/DragDropContext';
import { TEXT_ELEMENT_TYPES } from '@/elements/menuRegistry';
import { useDndStore } from '@/store/dndStore';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import getNewLayoutWithTextEditor from '@/utils/getNewLayoutWithTextEditor';
import AISlideGenerator from '../AISlideGenerator/AISlideGenerator';
import SlideBottomButtons from '../SlideBottomButtons/SlideBottomButtons';

interface SlideEditorProps {
    slideLayoutIds: string[];
    presentationId: string;
    isSelected: boolean;
    tiptapRefs: MutableRefObject<TipTapRefs>;
    slideId: string;
    handleSelectSlide: (slideId: string) => void;
    isLast: boolean;
}

const SlideEditor: React.FC<SlideEditorProps> = ({
    slideLayoutIds,
    slideId,
    tiptapRefs,
    presentationId,
    handleSelectSlide,
    isSelected,
    isLast,
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [showHeightIndicator, setShowHeightIndicator] = useState(false);
    const [standardHeight, setStandardHeight] = useState(0);
    const openMenu = useMenuStore.getState().openMenu;

    const slideRef = useRef<HTMLDivElement>(null);

    const isReadOnly = useReadOnly();

    const contentAlignment = usePresentationStore(state => state.getSlide(presentationId, slideId)?.contentAlignment);
    const slide = usePresentationStore(state => state.getSlide(presentationId, slideId));
    const imageHeightRatio = slide?.imageHeightRatio;
    const imageWidthRatio = slide?.imageWidthRatio;
    const templateType = usePresentationStore(state => state.getSlide(presentationId, slideId)?.templateType);
    const imageUrl = usePresentationStore(state => state.getSlide(presentationId, slideId)?.imageUrl);

    const addEmptySlideSelector = useCallback((state: PresentationState) => state.addEmptySlide, []);
    const addEmptySlide = usePresentationStore(addEmptySlideSelector);

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
                addEmptySlide(presentationId, newSlideIndex);
            }
        },
        [presentationId, slideId, addEmptySlide]
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

    const handleSlideClick = useCallback(
        (e: React.MouseEvent) => {
            if (isReadOnly) {
                return;
            }

            const slide = usePresentationStore.getState().getSlide(presentationId, slideId)!;
            if (!slide?.layouts.length) return;

            // Get all layout elements and their positions
            const layoutElements = slide.layouts
                .map(layout => {
                    const element = document.querySelector(`[data-layout-id="${layout.id}"]`);
                    return {
                        layout,
                        rect: element?.getBoundingClientRect(),
                    };
                })
                .filter(item => item.rect);

            // Check if click was between layouts
            for (let i = 0; i < layoutElements.length - 1; i++) {
                const currentLayout = layoutElements[i];
                const nextLayout = layoutElements[i + 1];

                const gapTop = currentLayout.rect!.bottom;
                const gapBottom = nextLayout.rect!.top;

                if (e.clientY > gapTop && e.clientY < gapBottom) {
                    // Проверяем ближайший layout сверху
                    const currentLayoutHasSingleTextEditor =
                        currentLayout.layout.elements.length === 1 &&
                        TEXT_ELEMENT_TYPES.includes(currentLayout.layout.elements[0].elementTypeId);

                    if (currentLayoutHasSingleTextEditor) {
                        const editor = tiptapRefs.current?.editors[currentLayout.layout.elements[0].id]?.editor;
                        if (editor) {
                            editor.chain().focus().run();
                            return;
                        }
                    }

                    // Проверяем ближайший layout снизу
                    const nextLayoutHasSingleTextEditor =
                        nextLayout.layout.elements.length === 1 &&
                        TEXT_ELEMENT_TYPES.includes(nextLayout.layout.elements[0].elementTypeId);
                    if (nextLayoutHasSingleTextEditor) {
                        const editor = tiptapRefs.current?.editors[nextLayout.layout.elements[0].id]?.editor;
                        if (editor) {
                            editor.chain().focus().run();
                            return;
                        }
                    }

                    // Если не смогли поставить фокус ни на один из редакторов, создаем новый layout
                    const newLayout = getNewLayoutWithTextEditor({
                        tempLayout: true,
                    });

                    const editorId = newLayout.elements[0].id;
                    setTimeout(() => {
                        tiptapRefs.current?.editors[editorId]?.editor.chain().focus().run();
                    }, 40);
                    usePresentationStore.getState().addLayout(presentationId, slideId, newLayout, i + 1);
                    return;
                }
            }

            // Check if click was below last layout
            const lastLayout = layoutElements[layoutElements.length - 1];
            if (e.clientY > lastLayout.rect!.bottom) {
                if (
                    lastLayout.layout.elements.length === 1 &&
                    TEXT_ELEMENT_TYPES.includes(lastLayout.layout.elements[0].elementTypeId) &&
                    tiptapRefs.current?.editors[lastLayout.layout.elements[0].id]
                ) {
                    tiptapRefs.current?.editors[lastLayout.layout.elements[0].id]?.editor.chain().focus().run();
                    return;
                }

                const newLayout = getNewLayoutWithTextEditor({
                    tempLayout: true,
                });

                const editorId = newLayout.elements[0].id;
                setTimeout(() => {
                    tiptapRefs.current?.editors[editorId]?.editor.chain().focus().run();
                }, 40);

                usePresentationStore.getState().addLayout(presentationId, slideId, newLayout, layoutElements.length);
            }

            const firstLayout = layoutElements[0];
            if (e.clientY < firstLayout.rect!.top) {
                if (
                    firstLayout.layout.elements.length === 1 &&
                    TEXT_ELEMENT_TYPES.includes(firstLayout.layout.elements[0].elementTypeId) &&
                    tiptapRefs.current?.editors[firstLayout.layout.elements[0].id]
                ) {
                    tiptapRefs.current?.editors[firstLayout.layout.elements[0].id]?.editor.chain().focus().run();
                    return;
                }

                const newLayout = getNewLayoutWithTextEditor({
                    tempLayout: true,
                });

                const editorId = newLayout.elements[0].id;
                setTimeout(() => {
                    tiptapRefs.current?.editors[editorId]?.editor.chain().focus().run();
                }, 40);
                usePresentationStore.getState().addLayout(presentationId, slideId, newLayout, 0);
            }
        },
        [tiptapRefs, presentationId, slideId, isReadOnly]
    );

    // Image rendering based on template type
    const imageStyle: React.CSSProperties = useMemo(() => {
        if (!templateType) return {};

        const baseStyle: React.CSSProperties = {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        };

        if (imageUrl) {
            baseStyle.backgroundImage = `url(${imageUrl})`;
        }

        // Calculate dimensions based on ratios
        const currentImageWidthRatio = imageWidthRatio || 0.33; // Default 33%
        const currentImageHeightRatio = imageHeightRatio || 0.33; // Default 33%

        // Convert ratios to CSS values
        const imageWidthPercent = `${currentImageWidthRatio * 100}%`;
        // For height, we need to calculate based on slide width
        // In editor, slide width is calc(64.5em / 1)
        const imageHeightVw = `calc(64.5em * ${currentImageHeightRatio})`;

        switch (templateType) {
            case 'imageTop':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: imageHeightVw,
                    zIndex: 1,
                };
            case 'imageLeft':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: imageWidthPercent,
                    zIndex: 1,
                };
            case 'imageRight':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: imageWidthPercent,
                    zIndex: 1,
                };
            case 'imageBackground':
                // This is handled by slide background
                return {};
            default:
                return {};
        }
    }, [templateType, imageUrl, imageWidthRatio, imageHeightRatio]);

    // Calculate content style for layouts based on template
    const contentStyle: React.CSSProperties = useMemo(() => {
        // Base styles
        const baseStyle: React.CSSProperties = {
            position: 'relative',
            height: '100%',
            width: '100%',
            // Font scaling now handled by gamma.app-style system in ElementContent
        } as React.CSSProperties;

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
            // Calculate dimensions based on ratios
            const currentImageWidthRatio = imageWidthRatio || 0.33; // Default 33%
            const currentImageHeightRatio = imageHeightRatio || 0.33; // Default 33%

            // Convert ratios to CSS values
            const imageWidthPercent = `${currentImageWidthRatio * 100}%`;
            const imageHeightVw = `calc(64.5em * ${currentImageHeightRatio})`;

            const remainingWidth = `${(1 - currentImageWidthRatio) * 100}%`;
            // For remaining height, we need to subtract the image height from total height
            const remainingHeight = `calc(100% - 64.5em * ${currentImageHeightRatio})`;

            switch (templateType) {
                case 'imageTop':
                    return {
                        ...baseStyle,
                        position: 'relative',
                        paddingTop: imageHeightVw,
                        height: remainingHeight,
                    };
                case 'imageLeft':
                    return {
                        ...baseStyle,
                        position: 'relative',
                        marginLeft: imageWidthPercent,
                        width: remainingWidth,
                    };
                case 'imageRight':
                    return {
                        ...baseStyle,
                        position: 'relative',
                        width: remainingWidth,
                    };
                case 'imageBackground':
                    return {
                        ...baseStyle,
                        position: 'relative',
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
    }, [contentAlignment, templateType, imageWidthRatio, imageHeightRatio, imageUrl]);

    // Add useDnd hook
    const { handleDragStart } = useDnd();

    const isDropTarget = useDndStore(({ state }) => state.indicators.slideIndicator === slideId);
    const isDragging = useDndStore(({ state }) => state.dragState === 'dragging' && state.source.slideId === slideId);
    // Добавляем проверку на активный индикатор для слайда
    // const isDropTarget = state.indicators.slideIndicator === slideId;

    const [showAIGenerator, setShowAIGenerator] = useState(false);

    const handleAddSlideWithAI = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setShowAIGenerator(true);
    };

    // Monitor slide content height to show standard height indicator
    useEffect(() => {
        const checkSlideHeight = () => {
            if (!slideRef.current || isReadOnly) return;

            const slideWrapper = slideRef.current.querySelector(`.${styles.slideWrapper}`) as HTMLElement;
            if (!slideWrapper) return;

            // Calculate standard height based on slide width (16:9 aspect ratio)
            const slideWidth = slideWrapper.offsetWidth;
            const calculatedStandardHeight = slideWidth / 1.7777777777777777; // 16:9 ratio

            const actualHeight = slideWrapper.offsetHeight;

            setStandardHeight(calculatedStandardHeight);
            setShowHeightIndicator(actualHeight > calculatedStandardHeight + 10); // 10px tolerance
        };

        // Check on mount and when content changes
        checkSlideHeight();

        // Use ResizeObserver to monitor size changes
        const resizeObserver = new ResizeObserver(checkSlideHeight);
        if (slideRef.current) {
            resizeObserver.observe(slideRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [slideLayoutIds, isReadOnly]);

    return (
        <div
            className={`${styles.slide} ${isDropTarget ? 'active-slide-drop-target' : ''} ${isLast ? styles.slideLast : ''}`}
            ref={slideRef}
            aria-label={`Slide ${slideId}`}
            data-slide-dragging={isDragging ? 'true' : undefined}
            onClick={handleSlideWrapperClick}
            onMouseEnter={() => !isReadOnly && setIsHovered(true)}
            onMouseLeave={() => !isReadOnly && setIsHovered(false)}
            onKeyDown={e => {
                if (!isReadOnly && (e.key === 'Enter' || e.key === ' ')) {
                    handleSlideWrapperClick(e as unknown as React.MouseEvent);
                }
            }}
        >
            <div className={`${getSlideClassName()}`} data-slide="true">
                <div className={`${styles.slideBorder} ${isSelected || isHovered ? styles.slideBorderMenuOpen : ''}`} />
                <div ref={editorRef} className={`${styles.slideContent}`} data-slide-content="true">
                    {(isSelected || slideMenuOpen || isHovered) && !isReadOnly && (
                        <>
                            <DragHandler
                                className={styles.slideDragHandle}
                                slideId={slideId}
                                isActive={slideMenuOpen}
                                ariaLabel="Перетащить или открыть меню слайда"
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
                            <div className={styles.slideButtons}>
                                <TemplateButton
                                    presentationId={presentationId}
                                    slideId={slideId}
                                    isShowed={isHovered || isSelected}
                                    tiptapRefs={tiptapRefs}
                                />
                                <AIEditButton
                                    presentationId={presentationId}
                                    slideId={slideId}
                                    isShowed={isHovered || isSelected}
                                    tiptapRefs={tiptapRefs}
                                />
                            </div>
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

                    {/* Standard height indicator */}
                    {showHeightIndicator && !isReadOnly && (
                        <div className={styles.standardHeightIndicator} style={{ top: `${standardHeight}px` }} />
                    )}
                </div>

                {!isReadOnly && (
                    <SlideBottomButtons
                        isShow={isSelected || isHovered}
                        slideRef={slideRef}
                        isLast={isLast}
                        handleAddSlideAfter={handleAddSlideAfter}
                        handleAddSlideWithAI={handleAddSlideWithAI}
                    />
                )}

                {showAIGenerator && (
                    <div className={styles.aiGeneratorOverlay} onClick={() => setShowAIGenerator(false)}>
                        <div onClick={e => e.stopPropagation()}>
                            <AISlideGenerator
                                presentationId={presentationId}
                                slideId={slideId}
                                onClose={() => setShowAIGenerator(false)}
                            />
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
        prevProps.slideId === nextProps.slideId &&
        prevProps.isLast === nextProps.isLast
    );
});
