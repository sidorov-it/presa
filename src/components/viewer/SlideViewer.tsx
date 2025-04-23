import React, { useMemo } from 'react';
import { Layout, Slide } from '@/types';
import LayoutViewer from './LayoutViewer';
import styles from '../editor/SlideEditor/SlideEditor.module.css';
import ViewerTemplateImage from './ViewerTemplateImage';

interface SlideViewerProps {
    slide: Slide;
    presentationId: string;
}

const SlideViewer: React.FC<SlideViewerProps> = ({ slide, presentationId }) => {
    // Get slide background styling
    const getSlideStyle = () => {
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

    return (
        <div className={styles.slide}>
            <div className={styles.slideWrapper} style={getSlideStyle()}>
                <div className={styles.slideContent}>
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
                            <LayoutViewer 
                                key={layout.id} 
                                layout={layout} 
                                slideId={slide.id} 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SlideViewer;
