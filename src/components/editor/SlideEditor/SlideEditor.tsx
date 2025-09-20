/* eslint-disable indent */
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
import { useUIStateStore } from '@/store/uiStateStore';
import deepEqual from 'deep-equal';
import { useDnd } from '@/contexts/DragDropContext';
import { TEXT_ELEMENT_TYPES } from '@/elements/menuRegistry';
import { useDndStore } from '@/store/dndStore';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import getNewLayoutWithTextEditor from '@/utils/getNewLayoutWithTextEditor';
import AISlideGenerator from '../AISlideGenerator/AISlideGenerator';
import SlideBottomButtons from '../SlideBottomButtons/SlideBottomButtons';
import TemplateTestModal from '../TemplateTestModal';
import HeaderFooter from '../HeaderFooter/HeaderFooter';
// import SlideHeaderFooterModal from '../SlideHeaderFooterModal/SlideHeaderFooterModal';
import { applyGlobalHeaderFooterToSlide } from '@/utils/applyGlobalHeaderFooter';
import { getHeaderFooterLogoPadding } from '@/utils/headerFooterPadding';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

interface SlideEditorProps {
    slideLayoutIds: string[];
    presentationId: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
    slideId: string;
    isLast: boolean;
}

const DEFAULT_CONTENT_PADDING = 'var(--card-inner-padding-y)';

const SlideEditor: React.FC<SlideEditorProps> = ({
    slideLayoutIds,
    slideId,
    tiptapRefs,
    presentationId,
    isLast,
    theme,
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const { hasActiveSubscription } = useSubscriptionCheck();

    const openMenu = useUIStateStore.getState().openContextMenu;

    const slideRef = useRef<HTMLDivElement>(null);

    const isReadOnly = useReadOnly();

    const backgroundType = usePresentationStore(state => state.getSlide(presentationId, slideId)?.background?.type);
    const backgroundValue = usePresentationStore(state => state.getSlide(presentationId, slideId)?.background?.value);

    const contentAlignment = usePresentationStore(state => state.getSlide(presentationId, slideId)?.contentAlignment);
    const slide = usePresentationStore(state => state.getSlide(presentationId, slideId));
    const imageHeightRatio = slide?.imageHeightRatio;
    const imageWidthRatio = slide?.imageWidthRatio;
    // Get slide index and total slides for numbering
    const presentation = usePresentationStore(state => state.getPresentation(presentationId));
    const currentSlideIndex = presentation?.slides.findIndex(s => s.id === slideId) ?? 0;
    const totalSlides = presentation?.slides.length ?? 1;

    // Apply global header/footer settings
    const effectiveSlide = slide
        ? applyGlobalHeaderFooterToSlide(
              slide,
              currentSlideIndex,
              totalSlides,
              presentation?.headerFooterConfig || {
                  header: {
                      enabled: false,
                      left: { type: 'none' },
                      center: { type: 'none' },
                      right: { type: 'none' },
                  },
                  footer: {
                      enabled: false,
                      left: { type: 'none' },
                      center: { type: 'none' },
                      right: { type: 'none' },
                  },
                  applyTo: 'all',
              },
              currentSlideIndex
          )
        : null;

    // Get header and footer configurations
    const header = effectiveSlide?.header;
    const footer = effectiveSlide?.footer;

    const templateType = usePresentationStore(state => state.getSlide(presentationId, slideId)?.templateType);
    const imageUrl = usePresentationStore(state => state.getSlide(presentationId, slideId)?.imageUrl);

    const addEmptySlideSelector = useCallback((state: PresentationState) => state.addEmptySlide, []);
    const addEmptySlide = usePresentationStore(addEmptySlideSelector);

    const selectedSlideId = useUIStateStore(state => state.selectedSlideId);
    const isSelected = selectedSlideId === slideId;

    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [showTemplateTestModal, setShowTemplateTestModal] = useState(false);

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

    const handleAddSlideWithAI = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setShowAIGenerator(true);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    };

    const handleTestTemplate = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setShowTemplateTestModal(true);
    }, []);

    const handleTemplateTest = useCallback(
        async (templateId: string) => {
            try {
                const response = await fetch('/api/ai/template-test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ templateId }),
                });

                if (!response.ok) {
                    throw new Error('Failed to test template');
                }

                const result = await response.json();

                // Add the test slide after the current slide
                const getSlideIndex = usePresentationStore.getState().getSlideIndex;
                const slideIndex = getSlideIndex(presentationId, slideId);

                if (slideIndex !== -1) {
                    const newSlideIndex = slideIndex + 1;
                    usePresentationStore.getState().addSlide(presentationId, result.slide, newSlideIndex);
                }

                setShowTemplateTestModal(false);
            } catch (error) {
                console.error('Error testing template:', error);
                // TODO: Show error message to user
            }
        },
        [presentationId, slideId]
    );

    const handleSelectSlide = useCallback((slideId: string) => {
        useUIStateStore.getState().setSelectedSlideId(slideId);
    }, []);

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

    const getSlideStyle = useCallback(() => {
        const style: React.CSSProperties & Record<string, string> = {};

        if (templateType === 'imageBackground' && imageUrl) {
            style.backgroundImage = `url(${imageUrl})`;
        }

        // Use background color from slide data
        if (backgroundType === 'color' && backgroundValue) {
            style['--presentation-slide-background'] = backgroundValue;
        }

        return style;
    }, [imageUrl, templateType, backgroundType, backgroundValue]);

    const slideMenuOpen = useUIStateStore(state => state.checkSlideContextMenuIsOpen(slideId));

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

        const rawHeaderPadding = getHeaderFooterLogoPadding(header);
        const rawFooterPadding = getHeaderFooterLogoPadding(footer);

        const resolvedHeaderPadding = rawHeaderPadding ?? DEFAULT_CONTENT_PADDING;
        const resolvedFooterPadding = rawFooterPadding ?? DEFAULT_CONTENT_PADDING;

        baseStyle.paddingTop = resolvedHeaderPadding;
        baseStyle.paddingBottom = resolvedFooterPadding;
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

            const remainingWidth = `${(1 - currentImageWidthRatio) * 100}%`;
            // For remaining height, we need to subtract the image height from total height
            const remainingHeight = `calc(100% - 64.5em * ${currentImageHeightRatio} - 1em)`;

            switch (templateType) {
                case 'imageTop': {
                    const imageHeightValue = `calc(64.5em * ${currentImageHeightRatio})`;
                    const topSpacing = resolvedHeaderPadding;
                    const paddingTopValue = `calc(${imageHeightValue} + ${topSpacing} + 1em)`;

                    return {
                        ...baseStyle,
                        position: 'relative',
                        paddingTop: paddingTopValue,
                        height: remainingHeight,
                    };
                }
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
    }, [contentAlignment, templateType, header, footer, imageWidthRatio, imageHeightRatio, imageUrl]);

    // Add useDnd hook
    const { handleDragStart } = useDnd();

    const isDropTarget = useDndStore(({ state }) => state.indicators.slideIndicator === slideId);
    const isDragging = useDndStore(({ state }) => state.dragState === 'dragging' && state.source.slideId === slideId);

    // Cleanup body scroll on unmount
    useEffect(() => {
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

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
            style={getSlideStyle()}
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

                    {/* Header */}
                    {hasActiveSubscription && header && (
                        <HeaderFooter
                            config={header}
                            type="header"
                            currentSlideIndex={currentSlideIndex}
                            totalSlides={totalSlides}
                            theme={theme}
                        />
                    )}

                    <div
                        className={styles.slideContainer}
                        data-slide-id={slideId}
                        data-slide-container="true"
                        style={contentStyle}
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

                    {/* Footer */}
                    {hasActiveSubscription && footer && (
                        <HeaderFooter
                            config={footer}
                            type="footer"
                            currentSlideIndex={currentSlideIndex}
                            totalSlides={totalSlides}
                            theme={theme}
                        />
                    )}
                </div>

                {!isReadOnly && (
                    <SlideBottomButtons
                        isShow={isSelected || isHovered}
                        slideRef={slideRef}
                        isLast={isLast}
                        handleAddSlideAfter={handleAddSlideAfter}
                        handleAddSlideWithAI={handleAddSlideWithAI}
                        handleTestTemplate={handleTestTemplate}
                    />
                )}

                {showAIGenerator && (
                    <div
                        className={styles.aiGeneratorOverlay}
                        onClick={() => {
                            setShowAIGenerator(false);
                            document.body.style.overflow = '';
                        }}
                    >
                        <div onClick={e => e.stopPropagation()}>
                            <AISlideGenerator
                                presentationId={presentationId}
                                slideId={slideId}
                                onClose={() => {
                                    setShowAIGenerator(false);
                                    document.body.style.overflow = '';
                                }}
                            />
                        </div>
                    </div>
                )}

                {showTemplateTestModal && (
                    <TemplateTestModal
                        isOpen={showTemplateTestModal}
                        onClose={() => setShowTemplateTestModal(false)}
                        onSelectTemplate={handleTemplateTest}
                    />
                )}
            </div>
        </div>
    );
};

// Enhanced memo comparison to perform deep comparison of relevant slide properties
export default memo(SlideEditor, (prevProps, nextProps) => {
    return (
        deepEqual(prevProps.slideLayoutIds, nextProps.slideLayoutIds) &&
        prevProps.presentationId === nextProps.presentationId &&
        prevProps.slideId === nextProps.slideId &&
        prevProps.isLast === nextProps.isLast
    );
});
