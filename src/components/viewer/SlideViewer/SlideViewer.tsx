/* eslint-disable prettier/prettier */
/* eslint-disable indent */
/* eslint-disable no-nested-ternary */
import React, { useCallback, useMemo } from 'react';
import { Layout, Slide } from '@/types';
import LayoutViewer from '../LayoutViewer/LayoutViewer';
import ViewerTemplateImageWithPlaceholder from '../ViewerTemplateImageWithPlaceholder';
import HeaderFooter from '../../editor/HeaderFooter/HeaderFooter';
import { applyGlobalHeaderFooterToSlide } from '@/utils/applyGlobalHeaderFooter';
import { getHeaderFooterLogoPadding } from '@/utils/headerFooterPadding';

import styles from '../../editor/SlideEditor/SlideEditor.module.css';
import localStyles from './SlideViewer.module.css';
import { Theme } from '@/types/theme';

const DEFAULT_CONTENT_PADDING = 'var(--card-inner-padding-y)';

interface SlideViewerProps {
    slide: Slide;
    themeClassName?: string;
    presentationId?: string;
    isPdfExport?: boolean;
    /** Display slide without borders and fill entire page */
    fullPage?: boolean;
    /** Show image placeholder when image is not provided (for preview modes) */
    showImagePlaceholder?: boolean;
    isPreview?: boolean;
    primaryAccentColor: string;
    /** Reference to the scrollable wrapper element */
    wrapperRef?: React.Ref<HTMLDivElement>;
    isSlidePreview?: boolean;
    theme: Theme;
    /** Current slide index for numbering (0-based) */
    currentSlideIndex?: number;
    /** Total number of slides */
    totalSlides?: number;
    /** Global header/footer configuration */
    globalHeaderFooterConfig?: any;
    /** Hide branding watermark for premium users */
    hideBranding?: boolean;
    /** Has active subscription flag */
    hasActiveSubscription?: boolean;
}

// No longer needed - we now use imageHeightRatio and imageWidthRatio directly

const SlideViewer: React.FC<SlideViewerProps> = ({
    slide,
    themeClassName = '',
    presentationId: _presentationId,
    isPdfExport = false,
    fullPage = false,
    showImagePlaceholder = false,
    isPreview = false,
    isSlidePreview = false,
    hideBranding = false,
    hasActiveSubscription = false,
    primaryAccentColor,
    wrapperRef,
    theme,
    currentSlideIndex = 0,
    totalSlides = 1,
    globalHeaderFooterConfig,
}) => {
    // Get slide background styling
    const getSlideStyle = useCallback(() => {
        // Base style with CSS variables
        const style: React.CSSProperties = {};

        // Apply slide-specific background if available
        if (slide?.templateType === 'imageBackground') {
            if (slide?.imageUrl) {
                style.backgroundImage = `url(${slide.imageUrl})`;
                style.backgroundRepeat = 'no-repeat';
                style.backgroundPosition = 'center';
                style.backgroundSize = 'cover';
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                style['--presentation-slide-background'] = 'transparent';
            }
        } else if (slide?.background?.type === 'color' && slide.background.value) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            style['--presentation-slide-background'] = slide.background.value;
        }

        return style;
    }, [slide?.templateType, slide?.imageUrl, slide?.background]);

    // Image rendering based on template type
    const imageStyle: React.CSSProperties = useMemo(() => {
        if (!slide?.templateType) return {};

        const baseStyle: React.CSSProperties = {
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        };

        if (slide.imageUrl) {
            baseStyle.backgroundImage = `url(${slide.imageUrl})`;
        }

        // Add mask image based on theme setting
        const maskProperty = (() => {
            switch (slide.templateType) {
                case 'imageLeft':
                    return 'var(--presentation-slide-image-mask-image-left, none)';
                case 'imageRight':
                    return 'var(--presentation-slide-image-mask-image-right, none)';
                case 'imageTop':
                    return 'var(--presentation-slide-image-mask-image-top, none)';
                default:
                    return 'none';
            }
        })();

        if (maskProperty !== 'none') {
            baseStyle.maskImage = maskProperty;
            baseStyle.WebkitMaskImage = maskProperty;
            baseStyle.maskSize = 'cover';
            baseStyle.WebkitMaskSize = 'cover';
            baseStyle.maskPosition = 'center';
            baseStyle.WebkitMaskPosition = 'center';
            baseStyle.maskRepeat = 'no-repeat';
            baseStyle.WebkitMaskRepeat = 'no-repeat';
        }

        // Calculate dimensions based on ratios
        const currentImageWidthRatio = slide.imageWidthRatio || 0.33; // Default 33%
        const currentImageHeightRatio = slide.imageHeightRatio || 0.33; // Default 33%

        // Convert ratios to CSS values
        const imageWidthPercent = `${currentImageWidthRatio * 100}%`;
        // For height, we need to calculate based on slide width
        // In viewer, we use --card-width CSS variable as reference, but scale it properly
        const imageHeightVw = `calc(var(--card-width) * ${currentImageHeightRatio})`;

        switch (slide.templateType) {
            case 'imageTop': {
                return {
                    ...baseStyle,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: imageHeightVw,
                    zIndex: 1,
                    maxWidth: 'calc(64.5em / var(--card-font-scale, 1))',
                };
            }
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
    }, [slide.templateType, slide.imageUrl, slide.imageWidthRatio, slide.imageHeightRatio]);

    // Calculate content style for layouts based on template
    const contentStyle: React.CSSProperties = useMemo(() => {
        if (!slide) return {};

        // Base styles
        const baseStyle: React.CSSProperties = {
            position: 'relative',
            height: '100%',
            width: '100%',
            color: 'var(--presentation-text-color)',
            fontFamily: 'var(--presentation-body-font)',
            fontWeight: 'var(--presentation-body-weight)',
            letterSpacing: 'var(--presentation-body-letter-spacing)',
            textTransform: 'var(--presentation-body-capitalization)' as any,
            minHeight: 'var(--card-height)',
            margin: 'unset',
        };

        // For PDF export, allow natural height to avoid clipping
        if (isPdfExport) {
            baseStyle.minHeight = 'auto';
            baseStyle.height = 'auto';
        }

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

        // Применяем глобальные настройки колонтитулов к слайду
        const effectiveSlide = globalHeaderFooterConfig
            ? applyGlobalHeaderFooterToSlide(slide, currentSlideIndex, totalSlides, globalHeaderFooterConfig, currentSlideIndex)
            : slide;

        const rawHeaderPadding = getHeaderFooterLogoPadding(effectiveSlide.header);
        const rawFooterPadding = getHeaderFooterLogoPadding(effectiveSlide.footer);

        const resolvedHeaderPadding = rawHeaderPadding ?? DEFAULT_CONTENT_PADDING;
        const resolvedFooterPadding = rawFooterPadding ?? DEFAULT_CONTENT_PADDING;

        baseStyle.paddingTop = resolvedHeaderPadding;
        baseStyle.paddingBottom = resolvedFooterPadding;

        // Additional styles for image templates
        if (slide.templateType) {
            // Calculate dimensions based on ratios
            const currentImageWidthRatio = slide.imageWidthRatio || 0.33; // Default 33%
            const currentImageHeightRatio = slide.imageHeightRatio || 0.33; // Default 33%

            // Convert ratios to CSS values
            const imageWidthPercent = `${currentImageWidthRatio * 100}%`;

            const remainingWidth = `${(1 - currentImageWidthRatio) * 100}%`;
            // For remaining height, we need to subtract the image height from total height
            const remainingHeight = `calc(100% - 64.5em * var(--card-font-scale, 1) * ${currentImageHeightRatio} - 1em)`;
            const imageHeightValue = `calc(var(--card-width) * ${currentImageHeightRatio})`;

            switch (slide.templateType) {
                case 'imageTop':
                    return {
                        ...baseStyle,
                        position: 'relative',
                        zIndex: 2,
                        paddingTop: `calc(${imageHeightValue} + ${resolvedHeaderPadding} + 1em)`,
                        height: isPdfExport ? 'auto' : remainingHeight,
                    };
                case 'imageLeft':
                    return {
                        ...baseStyle,
                        position: 'relative',
                        zIndex: 2,
                        marginLeft: imageWidthPercent,
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
        } else {
            // Для слайдов без template типа базовые отступы уже выставлены выше
        }

        return baseStyle;
    }, [slide, currentSlideIndex, totalSlides, globalHeaderFooterConfig, isPdfExport]);

    let height;
    let width;
    let minHeight;
    let maxWidth;

    if (isSlidePreview) {
        width = '100%';
        height = 'auto';
        minHeight = 'var(--card-min-height)';
        maxWidth = 'none';
    } else if (isPreview) {
        height = 'auto';
    } else if (fullPage) {
        // width = 'var(--card-width)';
        minHeight = 'calc(1034px  / 1.7777)';
        height = 'auto';
    } else if (isPdfExport) {
        height = 'auto';
        minHeight = 'calc(1034px  / 1.7777)';
    }

    // Slide wrapper style including theme CSS variables
    const slideWrapperStyle: React.CSSProperties = {
        ...getSlideStyle(),
        // Apply border styles from CSS variables
        // borderRadius: fullPage ? 0 : 'var(--presentation-slide-border-radius)',
        // borderWidth: fullPage ? 0 : 'var(--presentation-slide-border-width)',
        // borderColor: 'var(--presentation-slide-border-color)',
        // borderStyle: fullPage ? 'none' : 'solid',
        // Apply background if not overridden by slide-specific background
        // backgroundColor: fullPage ? 'transparent' : 'var(--presentation-slide-background)',
        // boxShadow: fullPage ? 'none' : 'var(--presentation-slide-shadow)',
        width,
        maxWidth: maxWidth ?? width,
        minHeight: minHeight ?? height,
        height,
        ...(fullPage && { overflow: 'visible' }),
        // Дополнительные стили для PDF экспорта
        ...(isPdfExport && {
            overflow: 'visible',
            // padding: '20px',
        }),
    };

    if (isSlidePreview) {
        slideWrapperStyle.border = 'none';
    }

    // Slide content style
    const slideContentStyle: React.CSSProperties = {
        // backgroundColor: fullPage ? 'transparent' : 'var(--presentation-slide-background)',
        borderRadius: fullPage ? 0 : 'var(--presentation-slide-border-radius)',
        minHeight: isSlidePreview
            ? 'var(--card-min-height)'
            : fullPage
              ? 'var(--card-height)'
              : isPdfExport
                ? 'auto'
                : undefined,
        height: isSlidePreview || fullPage ? 'auto' : undefined,
        overflow: isSlidePreview || fullPage || isPdfExport ? 'visible' : 'auto',
        // transform: isSlidePreview ? 'scale(1)' : 'none',
    };

    // Адаптируем класс слайда при экспорте в PDF
    const slideClassName = `${styles.slide} ${localStyles.slide} ${themeClassName} ${isPdfExport ? styles.pdfExport : ''}`;
    // const outerStyle = fullPage ? { padding: 0, width: '100%', height: '100%' } : undefined;

    console.log('contentStyle', contentStyle);
    return (
        <div className={`${slideClassName} ${isSlidePreview ? localStyles.slidePreview : ''}`}>
            <div className={`${styles.slideWrapper} ${localStyles.slideWrapper}`} style={slideWrapperStyle}>
                <div
                    ref={wrapperRef}
                    className={`${styles.slideContent} ${localStyles.slideContent}`}
                    style={slideContentStyle}
                >
                    {/* Apply global header/footer settings */}
                    {(() => {
                        if (!hasActiveSubscription) {
                            return null;
                        }

                        const effectiveSlide = globalHeaderFooterConfig
                            ? applyGlobalHeaderFooterToSlide(
                                  slide,
                                  currentSlideIndex,
                                  totalSlides,
                                  globalHeaderFooterConfig,
                                  currentSlideIndex
                              )
                            : slide;

                        return (
                            effectiveSlide?.header && (
                                <HeaderFooter
                                    config={effectiveSlide.header}
                                    type="header"
                                    currentSlideIndex={currentSlideIndex}
                                    totalSlides={totalSlides}
                                    theme={theme}
                                />
                            )
                        );
                    })()}

                    {/* Template image if needed */}
                    {slide?.templateType &&
                        slide.templateType !== 'imageBackground' &&
                        slide.templateType !== 'standard' && (
                            <ViewerTemplateImageWithPlaceholder
                                templateType={slide.templateType}
                                imageUrl={slide.imageUrl}
                                imageStyle={imageStyle}
                                showPlaceholder={showImagePlaceholder}
                            />
                        )}

                    <div
                        className={`${styles.slideContainer} ${localStyles.slideContainer}`}
                        style={contentStyle}
                        data-class="slide-container"
                    >
                        {slide.layouts.map((layout: Layout) => (
                            <LayoutViewer
                                theme={theme}
                                key={layout.id}
                                layout={layout}
                                slideId={slide.id}
                                slideBackground={slide.background?.value}
                                primaryAccentColor={primaryAccentColor}
                                isSlidePreview={isSlidePreview}
                            />
                        ))}
                    </div>

                    {(() => {
                        if (!hasActiveSubscription) {
                            return null;
                        }

                        const effectiveSlide = globalHeaderFooterConfig
                            ? applyGlobalHeaderFooterToSlide(
                                  slide,
                                  currentSlideIndex,
                                  totalSlides,
                                  globalHeaderFooterConfig,
                                  currentSlideIndex
                              )
                            : slide;
                        return (
                            effectiveSlide?.footer && (
                                <HeaderFooter
                                    config={effectiveSlide.footer}
                                    type="footer"
                                    currentSlideIndex={currentSlideIndex}
                                    totalSlides={totalSlides}
                                    theme={theme}
                                />
                            )
                        );
                    })()}
                </div>

                {isPdfExport && !hideBranding && (
                    <a
                        href="https://slydle.ru"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '12px',
                            background: 'rgba(0, 0, 0, 0.7)',
                            border: '1px solid #ebebeb',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            fontWeight: 500,
                            textDecoration: 'none',
                            pointerEvents: 'none',
                            zIndex: 1000,
                        }}
                        data-slydle-watermark="true"
                    >
                        Сделано в Slydle
                    </a>
                )}
            </div>
        </div>
    );
};

export default SlideViewer;
