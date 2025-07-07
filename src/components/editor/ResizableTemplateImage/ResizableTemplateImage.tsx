/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import styles from './ResizableTemplateImage.module.css';
import deepEqual from 'deep-equal';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder/ImagePlaceholder';
import { useThemeStore } from '@/store/themeStore';
import { useHistoryStore } from '@/store/historyStore';
import ResizeHandlesPortal from './ResizeHandlesPortal';

const MIN_SIZE = 20;
const MAX_SIZE = 50;

interface ResizableTemplateImageProps {
    presentationId: string;
    slideId: string;
    templateType: string;
    imageUrl?: string;
    initialImageStyle: React.CSSProperties;
}

const ResizableTemplateImage: React.FC<ResizableTemplateImageProps> = ({
    presentationId,
    slideId,
    templateType,
    imageUrl,
    initialImageStyle,
}) => {
    const [isSelected, setIsSelected] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isHandleHovered, setIsHandleHovered] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    const updateSlide = usePresentationStore(state => state.updateSlide);
    const currentThemeImageShape = useThemeStore(state => state.getCurrentThemeImageShape());

    const slide = usePresentationStore(
        useCallback(state => state.getSlide(presentationId, slideId), [presentationId, slideId])
    );

    const clickOutside = useCallback((e: MouseEvent) => {
        if (!e.target) return;
        if (e.target instanceof HTMLElement && !e.target.closest(`.${styles.container}`)) {
            setIsSelected(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('click', clickOutside);
        return () => {
            document.removeEventListener('click', clickOutside);
        };
    }, [clickOutside]);

    const storedSize = useMemo(() => {
        // Convert from imageHeightRatio and imageWidthRatio to actual dimensions
        if (slide?.imageHeightRatio && slide?.templateType === 'imageTop') {
            return { heightRatio: slide.imageHeightRatio };
        }
        if (slide?.imageWidthRatio && (slide?.templateType === 'imageLeft' || slide?.templateType === 'imageRight')) {
            return { widthRatio: slide.imageWidthRatio };
        }

        // Default values
        if (slide?.templateType === 'imageTop') {
            return { heightRatio: 0.33 }; // Default 33% height ratio
        }
        return { widthRatio: 0.33 }; // Default 33% width ratio
    }, [slide?.imageHeightRatio, slide?.imageWidthRatio, slide?.templateType]);

    // State for tracking resize operation
    const [isResizing, setIsResizing] = useState(false);
    const [currentSize, setCurrentSize] = useState(storedSize);

    useEffect(() => {
        if (!isResizing) {
            setCurrentSize(storedSize);
        }
    }, [storedSize, isResizing]);

    // Refs for resize handling
    const startPosRef = useRef({ x: 0, y: 0 });
    const resizeDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const currentSizeRef = useRef(storedSize);
    const templateTypeRef = useRef(templateType);

    // Ref for the image element
    const imageRef = useRef<HTMLDivElement>(null);

    // Update image ratios on slide when they change and resizing is complete
    useEffect(() => {
        if (isResizing) return; // Don't update while actively resizing

        // Only update if values actually changed
        if (slide?.templateType === 'imageTop' && slide?.imageHeightRatio !== currentSize.heightRatio) {
            // This case might handle updates from external changes,
            // but for resize operations, we handle history explicitly.
        }
        if (
            (slide?.templateType === 'imageLeft' || slide?.templateType === 'imageRight') &&
            slide?.imageWidthRatio !== currentSize.widthRatio
        ) {
            // This case might handle updates from external changes,
            // but for resize operations, we handle history explicitly.
        }
    }, [currentSize, isResizing, presentationId, slideId, slide, updateSlide]);

    // Update refs when their corresponding state changes
    useEffect(() => {
        currentSizeRef.current = currentSize;
    }, [currentSize]);

    useEffect(() => {
        templateTypeRef.current = templateType;
    }, [templateType]);

    // Determine which resize handle to show based on template type
    const getResizeHandles = useCallback(() => {
        switch (templateType) {
            case 'imageTop':
                return ['bottom'];
            case 'imageLeft':
                return ['right'];
            case 'imageRight':
                return ['left'];
            default:
                return [];
        }
    }, [templateType]);

    // Compute final image style including stored dimensions
    const containerStyle = useMemo(() => {
        const { backgroundImage, ...rest } = initialImageStyle;

        if (templateType === 'imageBackground') {
            return {
                ...rest,
                zIndex: 10,
            };
        } else if (templateType === 'imageTop') {
            // Use CSS calc() to calculate height based on slide width
            // In editor, slide width is calc(64.5em / 1)
            const heightRatio = currentSize.heightRatio || 0.33;
            const height = `calc(64.5em * ${heightRatio})`;
            return {
                ...rest,
                height,
                zIndex: 10,
            };
        } else {
            const width = currentSize.widthRatio ? `${currentSize.widthRatio * 100}%` : '33%';
            return {
                ...rest,
                width,
                zIndex: 10,
            };
        }
    }, [currentSize.heightRatio, currentSize.widthRatio, initialImageStyle, templateType]);

    const imageStyle = useMemo(() => {
        return {
            width: '100%',
            height: '100%',
            objectFit: 'cover' as const,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        };
    }, []);

    // Handle resize movement
    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current);
        }

        animationFrameIdRef.current = requestAnimationFrame(() => {
            if (!imageRef.current) return;

            const parentRect = imageRef.current.parentElement?.parentElement?.getBoundingClientRect();
            if (!parentRect) return;

            const deltaX = e.clientX - startPosRef.current.x;
            const deltaY = e.clientY - startPosRef.current.y;

            if (resizeDirectionRef.current === 'horizontal') {
                let newWidthRatio;

                if (templateTypeRef.current === 'imageLeft') {
                    // For left image, increase width when dragging right
                    const baseWidthRatio = currentSizeRef.current.widthRatio || 0.33;
                    const parentWidth = parentRect.width;
                    const pixelWidth = baseWidthRatio * parentWidth + deltaX;
                    newWidthRatio = Math.max(MIN_SIZE / 100, Math.min(MAX_SIZE / 100, pixelWidth / parentWidth));
                } else if (templateTypeRef.current === 'imageRight') {
                    // For right image, increase width when dragging left
                    const baseWidthRatio = currentSizeRef.current.widthRatio || 0.33;
                    const parentWidth = parentRect.width;
                    const pixelWidth = baseWidthRatio * parentWidth - deltaX;
                    newWidthRatio = Math.max(MIN_SIZE / 100, Math.min(MAX_SIZE / 100, pixelWidth / parentWidth));
                }

                if (newWidthRatio) {
                    setCurrentSize({ widthRatio: newWidthRatio });
                }
            }

            if (resizeDirectionRef.current === 'vertical') {
                let newHeightRatio;

                if (templateTypeRef.current === 'imageTop') {
                    // For top image, calculate height ratio based on parent width
                    const baseHeightRatio = currentSizeRef.current.heightRatio || 0.33;
                    const parentWidth = parentRect.width;
                    const currentPixelHeight = baseHeightRatio * parentWidth;
                    const newPixelHeight = currentPixelHeight + deltaY;
                    newHeightRatio = Math.max(0.05, Math.min(1.0, newPixelHeight / parentWidth)); // Min 5%, Max 100%
                }

                if (newHeightRatio) {
                    setCurrentSize({ heightRatio: newHeightRatio });
                }
            }

            // Update start position for next move event
            startPosRef.current = { x: e.clientX, y: e.clientY };
        });
    }, []);

    // Handle resize end
    const handleResizeEnd = useCallback(() => {
        if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }

        // Save the ratio values to the slide
        const updateData: any = {};
        if (currentSizeRef.current.heightRatio !== undefined) {
            updateData.imageHeightRatio = currentSizeRef.current.heightRatio;
        }
        if (currentSizeRef.current.widthRatio !== undefined) {
            updateData.imageWidthRatio = currentSizeRef.current.widthRatio;
        }

        updateSlide(
            presentationId,
            slideId,
            updateData,
            true // force recording in the current transaction
        );

        useHistoryStore.getState().commitTransaction(presentationId);

        resizeDirectionRef.current = null;
        setIsResizing(false);

        // Remove global event listeners
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
    }, [handleResizeMove, presentationId, slideId, updateSlide]);

    // Handle resize start - must be defined after handleResizeMove and handleResizeEnd
    const handleResizeStart = useCallback(
        (e: React.MouseEvent, direction: 'horizontal' | 'vertical') => {
            e.preventDefault();
            e.stopPropagation();

            useHistoryStore.getState().beginTransaction(presentationId, 'Resize Image');

            const initialPos = { x: e.clientX, y: e.clientY };
            startPosRef.current = initialPos;
            resizeDirectionRef.current = direction;
            setIsResizing(true);

            // Add global event listeners for mouse move and up
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
        },
        [handleResizeMove, handleResizeEnd, presentationId]
    );

    // Clean up event listeners on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [handleResizeMove, handleResizeEnd]);

    // Get resize handles based on template type
    const resizeHandles = getResizeHandles();

    if (templateType === 'standard' || (templateType === 'imageBackground' && !imageUrl)) {
        return null;
    }

    let imageMaskClass = '';
    if (currentThemeImageShape) {
        switch (templateType) {
            case 'imageTop':
                imageMaskClass = styles.maskImageTop;
                break;
            case 'imageLeft':
                imageMaskClass = styles.maskImageLeft;
                break;
            case 'imageRight':
                imageMaskClass = styles.maskImageRight;
                break;
            case 'imageBottom':
                imageMaskClass = styles.maskImageBottom;
                break;
            default:
                break;
        }
    }
    // Render template image with resize handles
    return (
        <>
            <div
                className={`${styles.container} ${isSelected ? styles.selected : ''}`}
                style={containerStyle}
                ref={containerRef}
                data-template-type={templateType}
                onClick={() => {
                    setIsSelected(true);
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div
                    ref={imageRef}
                    className={`${styles.templateImage} ${styles[templateType]} ${imageMaskClass}`}
                    style={imageStyle}
                    aria-label={`Изменяемый шаблон изображения ${templateType}`}
                    role="region"
                >
                    {imageUrl && (
                        <div
                            className={styles.templateImage}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                backgroundImage: `url(${imageUrl})`,
                            }}
                        >
                            {/* <Image src={imageUrl} alt={`Template ${templateType}`} fill /> */}
                        </div>
                    )}

                    {!imageUrl && (
                        <div
                            className={styles.templateImagePlaceholder}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                backgroundColor: 'var(--chakra-colors-gray-300)',
                            }}
                        >
                            <ImagePlaceholder
                                imageUrl={imageUrl || ''}
                                isWidthRightMenu={true}
                                onClearImage={() => {
                                    updateSlide(presentationId, slideId, {
                                        imageUrl: '',
                                    });
                                }}
                                onUpdateLink={(link: string) => {
                                    updateSlide(presentationId, slideId, {
                                        imageUrl: link,
                                    });
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Render resize handles in portal */}
            <ResizeHandlesPortal
                containerRef={containerRef}
                resizeHandles={resizeHandles}
                isVisible={isHovered || isHandleHovered || isResizing}
                onResizeStart={handleResizeStart}
                currentSize={currentSize}
                MIN_SIZE={MIN_SIZE}
                MAX_SIZE={MAX_SIZE}
                onHandleHover={setIsHandleHovered}
            />
        </>
    );
};

export default memo(ResizableTemplateImage, (prevProps, nextProps) => {
    return (
        deepEqual(prevProps.imageUrl, nextProps.imageUrl) &&
        deepEqual(prevProps.templateType, nextProps.templateType) &&
        deepEqual(prevProps.presentationId, nextProps.presentationId) &&
        deepEqual(prevProps.slideId, nextProps.slideId) &&
        deepEqual(prevProps.initialImageStyle, nextProps.initialImageStyle)
    );
});
