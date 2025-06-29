/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import styles from './ResizableTemplateImage.module.css';
import deepEqual from 'deep-equal';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder/ImagePlaceholder';
import { useThemeStore } from '@/store/themeStore';
import { useHistoryStore } from '@/store/historyStore';

import { convertImageSizeToRatio } from '@/utils/slideProportions';
const MIN_SIZE = 20;
const MAX_SIZE = 50;
const DEFAULT_HEIGHT_PX = 200;

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
        if (slide?.imageSize) {
            // Если есть сохраненные пропорции, используем их для вычисления размеров
            if ((slide.imageSize.widthRatio || slide.imageSize.heightRatio) && containerRef.current) {
                const slideElement = containerRef.current.closest('[data-slide-id]') as HTMLElement;
                if (slideElement) {
                    const slideRect = slideElement.getBoundingClientRect();
                    const result: { width?: string; height?: string } = {};

                    if (templateType === 'imageTop' && slide.imageSize.heightRatio) {
                        const heightInPixels = slide.imageSize.heightRatio * slideRect.height;
                        result.height = `${heightInPixels}px`;
                    } else if (
                        (templateType === 'imageLeft' || templateType === 'imageRight') &&
                        slide.imageSize.widthRatio
                    ) {
                        const widthInPixels = slide.imageSize.widthRatio * slideRect.width;
                        result.width = `${widthInPixels}px`;
                    }

                    // Возвращаем размеры из пропорций, если они есть, иначе сохраненные размеры
                    return {
                        width: result.width || slide.imageSize.width,
                        height: result.height || slide.imageSize.height,
                    };
                }
            }

            // Если пропорций нет или нет контейнера, используем сохраненные размеры
            return slide.imageSize;
        }

        // Размеры по умолчанию
        return slide?.templateType === 'imageTop' ? { height: `${DEFAULT_HEIGHT_PX}px` } : { width: '20%' };
    }, [slide?.imageSize, slide?.templateType, templateType]);

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

    // Update image size on slide when it changes and resizing is complete
    useEffect(() => {
        if (isResizing) return; // Don't update while actively resizing

        // Only update if values actually changed
        if (
            slide?.imageSize &&
            (currentSize.width !== slide.imageSize.width || currentSize.height !== slide.imageSize.height)
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
                ...(currentSize.width && { width: currentSize.width }),
                ...(currentSize.height && { height: currentSize.height }),
                zIndex: 10,
            };
        } else if (templateType === 'imageTop') {
            return {
                ...rest,
                ...(currentSize.height && { height: currentSize.height }),
                zIndex: 10,
            };
        } else {
            return {
                ...rest,
                ...(currentSize.width && { width: currentSize.width }),
                zIndex: 10,
            };
        }
    }, [currentSize.height, currentSize.width, initialImageStyle, templateType]);

    const imageStyle = useMemo(() => {
        const { width, height, ...rest } = currentSize;
        if (templateType === 'imageBackground') {
            return {
                // ...initialImageStyle,
                ...rest,
                // zIndex: 10,
            };
        } else if (templateType === 'imageTop') {
            return {
                // ...initialImageStyle,
                ...rest,
                // zIndex: 10,
            };
        } else {
            return {
                // ...initialImageStyle,
                ...rest,
                // zIndex: 10,
            };
        }
    }, [currentSize, templateType]);

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
                let newWidth;

                if (templateTypeRef.current === 'imageLeft') {
                    // For left image, increase width when dragging right
                    const baseWidth = parseFloat(currentSizeRef.current.width || '20%');
                    const parentWidth = parentRect.width;
                    const pixelWidth = (baseWidth / 100) * parentWidth + deltaX;
                    newWidth = `${Math.max(MIN_SIZE, Math.min(MAX_SIZE, (pixelWidth / parentWidth) * 100))}%`;
                } else if (templateTypeRef.current === 'imageRight') {
                    // For right image, increase width when dragging left
                    const baseWidth = parseFloat(currentSizeRef.current.width || '20%');
                    const parentWidth = parentRect.width;
                    const pixelWidth = (baseWidth / 100) * parentWidth - deltaX;
                    newWidth = `${Math.max(MIN_SIZE, Math.min(MAX_SIZE, (pixelWidth / parentWidth) * 100))}%`;
                }

                if (newWidth) {
                    setCurrentSize({ width: newWidth });
                }
            }

            if (resizeDirectionRef.current === 'vertical') {
                let newHeight;

                if (templateTypeRef.current === 'imageTop') {
                    // For top image, use pixels for height
                    const currentHeightString = currentSizeRef.current.height || `${DEFAULT_HEIGHT_PX}px`;
                    const baseHeight = parseFloat(currentHeightString);
                    // If the height is in pixels, add deltaY directly
                    const newHeightValue = baseHeight + deltaY;
                    // Enforce a minimum and maximum pixel height
                    newHeight = `${Math.max(50, Math.min(800, newHeightValue))}px`;
                }

                if (newHeight) {
                    setCurrentSize({ height: newHeight });
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

        // Получаем элемент слайда для расчета пропорций
        const slideElement = imageRef.current?.closest('[data-slide-id]') as HTMLElement;
        if (slideElement) {
            // Конвертируем текущий размер в пропорции
            const imageRatio = convertImageSizeToRatio(currentSizeRef.current, slideElement, templateTypeRef.current);

            // Сохраняем и размеры, и пропорции
            const updatedImageSize = {
                ...currentSizeRef.current,
                ...imageRatio,
            };

            updateSlide(
                presentationId,
                slideId,
                {
                    imageSize: updatedImageSize,
                },
                true // force recording in the current transaction
            );
        } else {
            updateSlide(
                presentationId,
                slideId,
                {
                    imageSize: currentSizeRef.current,
                },
                true // force recording in the current transaction
            );
        }

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

    // Handle keyboard resize
    const handleKeyboardResize = useCallback(
        (e: React.KeyboardEvent, direction: 'horizontal' | 'vertical', action: 'increase' | 'decrease') => {
            e.preventDefault();
            e.stopPropagation();

            if (!imageRef.current) return;

            const parentRect = imageRef.current.parentElement?.getBoundingClientRect();
            if (!parentRect) return;

            const newSize = { ...currentSizeRef.current };

            if (direction === 'horizontal') {
                const step = e.shiftKey ? 5 : 2; // Larger step with shift key
                const currentWidth = parseFloat(currentSizeRef.current.width || '20%');
                const newWidthValue =
                    action === 'increase'
                        ? Math.min(MAX_SIZE, currentWidth + step)
                        : Math.max(MIN_SIZE, currentWidth - step);
                newSize.width = `${newWidthValue}%`;
            } else {
                // For vertical resizing (height), use pixels for top/bottom images
                if (templateType === 'imageTop') {
                    const step = e.shiftKey ? 20 : 10; // Larger step with shift key
                    const currentHeightString = currentSizeRef.current.height || `${DEFAULT_HEIGHT_PX}px`;
                    const currentHeight = parseFloat(currentHeightString);
                    const newHeightValue =
                        action === 'increase'
                            ? Math.min(800, currentHeight + step)
                            : Math.max(50, currentHeight - step);
                    newSize.height = `${newHeightValue}px`;
                }
            }

            setCurrentSize(newSize);

            // Immediately update the slide with the new size and create a history entry
            updateSlide(presentationId, slideId, {
                imageSize: newSize,
            });
        },
        [presentationId, slideId, templateType, updateSlide]
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent, direction: 'horizontal' | 'vertical') => {
            // Handle arrow keys for resize
            switch (e.key) {
                case 'ArrowLeft':
                    if (direction === 'horizontal') {
                        handleKeyboardResize(e, direction, templateType === 'imageLeft' ? 'decrease' : 'increase');
                    }
                    break;
                case 'ArrowRight':
                    if (direction === 'horizontal') {
                        handleKeyboardResize(e, direction, templateType === 'imageLeft' ? 'increase' : 'decrease');
                    }
                    break;
                case 'ArrowUp':
                    if (direction === 'vertical') {
                        handleKeyboardResize(e, direction, templateType === 'imageTop' ? 'decrease' : 'increase');
                    }
                    break;
                case 'ArrowDown':
                    if (direction === 'vertical') {
                        handleKeyboardResize(e, direction, templateType === 'imageTop' ? 'increase' : 'decrease');
                    }
                    break;
                case 'Escape':
                    // Cancel resizing if the user presses Escape
                    setIsResizing(false);
                    resizeDirectionRef.current = null;
                    break;
                case 'Enter':
                case ' ': // Space key
                    // Toggle resizing mode
                    e.preventDefault();
                    if (!isResizing) {
                        setIsResizing(true);
                        resizeDirectionRef.current = direction;
                    } else {
                        setIsResizing(false);
                        resizeDirectionRef.current = null;
                    }
                    break;
                default:
                    break;
            }
        },
        [handleKeyboardResize, isResizing, templateType]
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
        <div
            className={`${styles.container} ${isSelected ? styles.selected : ''}`}
            style={containerStyle}
            ref={containerRef}
            data-template-type={templateType}
            onClick={() => {
                setIsSelected(true);
            }}
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

            {resizeHandles.includes('left') && (
                <div
                    className={styles.resizeHandleLeft}
                    onMouseDown={e => handleResizeStart(e, 'horizontal')}
                    onKeyDown={e => handleKeyDown(e, 'horizontal')}
                    tabIndex={0}
                    role="slider"
                    aria-label="Изменить ширину изображения"
                    aria-valuemin={MIN_SIZE}
                    aria-valuemax={MAX_SIZE}
                    aria-valuenow={parseInt(currentSize.width?.toString() || '20')}
                    aria-orientation="horizontal"
                />
            )}

            {resizeHandles.includes('right') && (
                <div
                    className={styles.resizeHandleRight}
                    onMouseDown={e => handleResizeStart(e, 'horizontal')}
                    onKeyDown={e => handleKeyDown(e, 'horizontal')}
                    tabIndex={0}
                    role="slider"
                    aria-label="Изменить ширину изображения"
                    aria-valuemin={MIN_SIZE}
                    aria-valuemax={MAX_SIZE}
                    aria-valuenow={parseInt(currentSize.width?.toString() || '20')}
                    aria-orientation="horizontal"
                />
            )}

            {resizeHandles.includes('top') && (
                <div
                    className={styles.resizeHandleTop}
                    onMouseDown={e => handleResizeStart(e, 'vertical')}
                    onKeyDown={e => handleKeyDown(e, 'vertical')}
                    tabIndex={0}
                    role="slider"
                    aria-label="Изменить высоту изображения"
                    aria-valuemin={50}
                    aria-valuemax={800}
                    aria-valuenow={parseInt(currentSize.height?.toString() || `${DEFAULT_HEIGHT_PX}`)}
                    aria-orientation="vertical"
                />
            )}

            {resizeHandles.includes('bottom') && (
                <div
                    className={styles.resizeHandleBottom}
                    onMouseDown={e => handleResizeStart(e, 'vertical')}
                    onKeyDown={e => handleKeyDown(e, 'vertical')}
                    tabIndex={0}
                    role="slider"
                    aria-label="Изменить высоту изображения"
                    aria-valuemin={50}
                    aria-valuemax={800}
                    aria-valuenow={parseInt(currentSize.height?.toString() || `${DEFAULT_HEIGHT_PX}`)}
                    aria-orientation="vertical"
                />
            )}
        </div>
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
