/* eslint-disable no-nested-ternary */
import React, { useMemo } from 'react';
import { Layout, Slide } from '@/types';
import LayoutViewer from '../LayoutViewer';
import ViewerTemplateImage from '../ViewerTemplateImage';

import styles from '../../editor/SlideEditor/SlideEditor.module.css';
import localStyles from './SlideViewer.module.css';

interface SlideViewerProps {
    slide: Slide;
    themeClassName?: string;
    presentationId?: string;
    isPdfExport?: boolean;
    /** Display slide without borders and fill entire page */
    fullPage?: boolean;
}

const SlideViewer: React.FC<SlideViewerProps> = ({
    slide,
    themeClassName = '',
    presentationId: _presentationId,
    isPdfExport = false,
    fullPage = false,
}) => {
    // Get slide background styling
    const getSlideStyle = () => {
        // Base style with CSS variables
        const style: React.CSSProperties = {};

        // Apply slide-specific background if available
        if (slide?.templateType === 'imageBackground') {
            if (slide?.imageUrl) {
                style.backgroundImage = `url(${slide.imageUrl})`;
            }
        } else if (slide?.background?.type === 'color') {
            style.backgroundColor = slide.background.value;
        }

        return style;
    };

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
            case 'imageLeft':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: slide.imageSize?.width || '33%',
                    zIndex: 1,
                };
            case 'imageRight':
                return {
                    ...baseStyle,
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: slide.imageSize?.width || '33%',
                    zIndex: 1,
                };
            case 'imageBackground':
                // This is handled by slide background
                return {};
            default:
                return {};
        }
    }, [slide?.templateType, slide?.imageUrl, slide?.imageSize]);

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
            lineHeight: 'var(--presentation-body-line-height)',
            letterSpacing: 'var(--presentation-body-letter-spacing)',
            textTransform: 'var(--presentation-body-capitalization)' as any,
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

    // Slide wrapper style including theme CSS variables
    const slideWrapperStyle: React.CSSProperties = {
        ...(fullPage ? {} : getSlideStyle()),
        // Apply border styles from CSS variables
        borderRadius: fullPage ? 0 : 'var(--presentation-slide-border-radius)',
        borderWidth: fullPage ? 0 : 'var(--presentation-slide-border-width)',
        borderColor: 'var(--presentation-slide-border-color)',
        borderStyle: fullPage ? 'none' : 'solid',
        // Apply background if not overridden by slide-specific background
        backgroundColor: fullPage ? 'transparent' : 'var(--presentation-slide-background)',
        boxShadow: fullPage ? 'none' : 'var(--presentation-slide-shadow)',
        // width: '100%',
        // maxWidth: '100%',
        // boxSizing: 'border-box',
        minHeight: fullPage ? '100vh' : isPdfExport ? 'auto' : undefined,
        height: fullPage ? '100vh' : isPdfExport ? 'auto' : undefined,
        // Apply slide-specific text color if available
        ...(slide?.textColor && {
            '--presentation-text-color': slide.textColor,
            '--presentation-heading-color': slide.textColor,
        }),
        // Дополнительные стили для PDF экспорта
        ...(isPdfExport && {
            overflow: 'visible',
            padding: '20px',
        }),
    };

    // Slide content style
    const slideContentStyle: React.CSSProperties = {
        backgroundColor: fullPage ? 'transparent' : 'var(--presentation-slide-background)',
        borderRadius: fullPage ? 0 : 'var(--presentation-slide-border-radius)',
        minHeight: fullPage ? '100%' : isPdfExport ? 'auto' : undefined,
        height: fullPage ? '100%' : isPdfExport ? 'auto' : undefined,
        overflow: isPdfExport ? 'visible' : undefined,
    };

    // Адаптируем класс слайда при экспорте в PDF
    const slideClassName = `${styles.slide} ${themeClassName} ${isPdfExport ? styles.pdfExport : ''}`;
    const outerStyle = fullPage ? { padding: 0, width: '100%', height: '100%' } : undefined;

    return (
        <div className={slideClassName} style={outerStyle}>
            <div className={`${styles.slideWrapper} ${localStyles.slideWrapper}`} style={slideWrapperStyle}>
                <div className={`${styles.slideContent} ${localStyles.slideContent}`} style={slideContentStyle}>
                    {/* Template image if needed */}
                    {slide?.templateType && slide.templateType !== 'imageBackground' && (
                        <ViewerTemplateImage
                            templateType={slide.templateType}
                            imageUrl={slide.imageUrl}
                            imageStyle={imageStyle}
                        />
                    )}

                    <div className={styles.slideContainer} style={contentStyle}>
                        {slide.layouts.map((layout: Layout) => (
                            <LayoutViewer key={layout.id} layout={layout} slideId={slide.id} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SlideViewer;
