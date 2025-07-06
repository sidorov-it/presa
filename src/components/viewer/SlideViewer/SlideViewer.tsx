/* eslint-disable prettier/prettier */
/* eslint-disable indent */
/* eslint-disable no-nested-ternary */
import React, { useCallback, useMemo } from 'react';
import { Layout, Slide } from '@/types';
import LayoutViewer from '../LayoutViewer/LayoutViewer';
import ViewerTemplateImageWithPlaceholder from '../ViewerTemplateImageWithPlaceholder';

import styles from '../../editor/SlideEditor/SlideEditor.module.css';
import localStyles from './SlideViewer.module.css';
import { Theme } from '@/types/theme';

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
    theme: Theme;
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
    primaryAccentColor,
    wrapperRef,
    theme,
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
        // In viewer, we use --card-width CSS variable as reference
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
                    maxWidth: 'calc(64.5em / 1)',
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
    }, [slide?.templateType, slide?.imageUrl, slide?.imageHeightRatio, slide?.imageWidthRatio]);

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
            textTransform: 'var(--presentation-body-capitalization)',
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
            // Calculate dimensions based on ratios
            const currentImageWidthRatio = slide.imageWidthRatio || 0.33; // Default 33%
            const currentImageHeightRatio = slide.imageHeightRatio || 0.33; // Default 33%

            // Convert ratios to CSS values
            const imageWidthPercent = `${currentImageWidthRatio * 100}%`;
            const imageHeightVw = `calc(var(--card-width) * ${currentImageHeightRatio})`;

            const remainingWidth = `${(1 - currentImageWidthRatio) * 100}%`;
            // For remaining height, we need to subtract the image height from total height
            const remainingHeight = `calc(100% - var(--card-width) * ${currentImageHeightRatio})`;

            switch (slide.templateType) {
                case 'imageTop':
                    return {
                        ...baseStyle,
                        position: 'relative',
                        zIndex: 2,
                        paddingTop: imageHeightVw,
                        height: remainingHeight,
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
        }

        return baseStyle;
    }, [slide, fullPage]);

    let height;
    let width;
    let minHeight;

    if (isPreview) {
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
        maxWidth: width,
        minHeight: minHeight ?? height,
        height,
        ...(fullPage && { overflow: 'visible' }),
        // Дополнительные стили для PDF экспорта
        ...(isPdfExport && {
            overflow: 'visible',
            // padding: '20px',
        }),
    };

    // Slide content style
    const slideContentStyle: React.CSSProperties = {
        // backgroundColor: fullPage ? 'transparent' : 'var(--presentation-slide-background)',
        borderRadius: fullPage ? 0 : 'var(--presentation-slide-border-radius)',
        minHeight: fullPage ? 'var(--card-height)' : isPdfExport ? 'auto' : undefined,
        height: fullPage ? 'auto' : undefined,
        overflow: fullPage || isPdfExport ? 'visible' : 'auto',
    };

    // Адаптируем класс слайда при экспорте в PDF
    const slideClassName = `${styles.slide} ${localStyles.slide} ${themeClassName} ${isPdfExport ? styles.pdfExport : ''}`;
    // const outerStyle = fullPage ? { padding: 0, width: '100%', height: '100%' } : undefined;

    return (
        <div className={slideClassName}>
            <div
                className={`${styles.slideWrapper} ${localStyles.slideWrapper}`}
                style={slideWrapperStyle}
            >
                <div
                    ref={wrapperRef}
                    className={`${styles.slideContent} ${localStyles.slideContent}`}
                    style={slideContentStyle}
                >
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

                    <div className={`${styles.slideContainer} ${localStyles.slideContainer}`} style={contentStyle}>
                        {slide.layouts.map((layout: Layout) => (
                            <LayoutViewer
                                theme={theme}
                                key={layout.id}
                                layout={layout}
                                slideId={slide.id}
                                slideBackground={slide.background?.value}
                                primaryAccentColor={primaryAccentColor}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SlideViewer;
