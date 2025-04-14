/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ImageElement } from '@/types';
import { default as ImageComponent } from 'next/image';
import { usePresentationStore } from '@/store/presentationStore';

import styles from './Image.module.css';

interface ImageProps {
    element: ImageElement;
    className?: string;
    presentationId?: string;
    slideId?: string;
    layoutId?: string;
    hasMultipleCells?: boolean;
}

// Типы направлений изменения размера
type ResizeDirection = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const Image: React.FC<ImageProps> = ({
    element,
    className = '',
    presentationId,
    slideId,
    layoutId,
    hasMultipleCells,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSelected, setIsSelected] = useState(false);
    const [resizing, setResizing] = useState(false);
    const [startWidth, setStartWidth] = useState(0);
    const [startHeight, setStartHeight] = useState(0);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
    const [aspectRatio, setAspectRatio] = useState(1);

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const updateElement = usePresentationStore(state => state.updateElement);

    const handleImageLoad = () => {
        setIsLoading(false);
        // Сохраняем соотношение сторон изображения при загрузке
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setAspectRatio(rect.width / rect.height);
        }
    };

    const handleImageError = () => {
        setIsLoading(false);
        setError('Failed to load image');
    };

    const handleClickImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsSelected(true);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsSelected(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle resize start
    const handleResizeStart = (e: React.MouseEvent, direction: ResizeDirection) => {
        e.preventDefault();
        e.stopPropagation();
        setResizing(true);
        setResizeDirection(direction);

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setStartWidth(rect.width);
            setStartHeight(rect.height);
            setAspectRatio(rect.width / rect.height);
        }

        setStartX(e.clientX);
        setStartY(e.clientY);
    };

    // Handle resize movement
    const handleResizeMove = (e: MouseEvent) => {
        if (!resizing || !resizeDirection || !containerRef.current) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        let newWidth = startWidth;
        let newHeight = startHeight;

        // Определяем изменение ширины в зависимости от направления
        if (resizeDirection.includes('right')) {
            newWidth = startWidth + deltaX;
        } else if (resizeDirection.includes('left')) {
            newWidth = startWidth - deltaX;
        } else if (resizeDirection === 'top' || resizeDirection === 'bottom') {
            // Для верхней и нижней точек используем изменение по Y
            // и пересчитываем ширину с учетом соотношения сторон
            if (resizeDirection === 'top') {
                newHeight = startHeight - deltaY;
            } else {
                // bottom
                newHeight = startHeight + deltaY;
            }
            // Пересчитываем ширину, сохраняя соотношение сторон
            newWidth = newHeight * aspectRatio;
        }

        // Ensure minimum width (100px)
        const width = Math.max(100, newWidth);

        // Update container max-width in the DOM
        containerRef.current.style.maxWidth = `${width}px`;
    };

    // Handle resize end
    const handleResizeEnd = () => {
        if (!resizing) return;

        setResizing(false);
        setResizeDirection(null);

        // Save the new width to the element data
        if (containerRef.current && presentationId && slideId && layoutId) {
            const newWidth = containerRef.current.clientWidth;
            updateElement(presentationId, slideId, layoutId, element.id, { width: newWidth });
        }
    };

    useEffect(() => {
        if (resizing) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [resizing, resizeDirection, handleResizeMove, handleResizeEnd]);

    // Get cursor style based on resize direction
    const getResizeCursor = (direction: ResizeDirection): string => {
        switch (direction) {
            case 'top':
            case 'bottom':
                return 'ns-resize';
            case 'left':
            case 'right':
                return 'ew-resize';
            case 'top-left':
            case 'bottom-right':
                return 'nwse-resize';
            case 'top-right':
            case 'bottom-left':
                return 'nesw-resize';
            default:
                return 'default';
        }
    };

    // Get alignment style based on element alignment property
    const getAlignmentClass = () => {
        switch (element.alignment) {
            case 'left':
                return 'mr-auto';
            case 'center':
                return 'mx-auto';
            case 'right':
                return 'ml-auto';
            default:
                return 'mx-auto'; // Default to center alignment
        }
    };

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            // console.error('Invalid URL:', error);
            return false;
        }
    };

    let leftTextWidth = 0;
    let rightTextWidth = 0;

    if (
        !hasMultipleCells &&
        containerRef.current?.parentElement &&
        imageRef.current &&
        // !isSelected &&
        element.src &&
        isValidUrl(element.src)
    ) {
        const parentWidth = containerRef.current.parentElement.clientWidth;
        const imageWidth = imageRef.current.clientWidth;

        // если по центру, то показываем блоки для добавления текста справа и слева
        if (element.alignment === 'center') {
            const textWidth = parentWidth - imageWidth - 20;
            const percent = textWidth / parentWidth;

            if (percent > 0.15) {
                leftTextWidth = textWidth / 2;
                rightTextWidth = textWidth / 2;
            }
        }
        // если по правому краю, то показываем блок для добавления текста слева
        if (element.alignment === 'right') {
            const textWidth = parentWidth - imageWidth - 20;
            const percent = textWidth / parentWidth;

            if (percent > 0.15) {
                leftTextWidth = textWidth;
                rightTextWidth = 0;
            }
        }
        // если по левому краю, то показываем блок для добавления текста справа
        if (element.alignment === 'left') {
            const textWidth = parentWidth - imageWidth - 20;
            const percent = textWidth / parentWidth;

            if (percent > 0.15) {
                leftTextWidth = 0;
                rightTextWidth = textWidth;
            }
        }
    }

    const handleAddText = () => {
        if (presentationId && slideId && layoutId) {
            const imageWidthPercent = parseFloat(
                ((imageRef.current!.clientWidth / containerRef.current!.parentElement!.clientWidth) * 100).toFixed(2)
            );

            if (element.alignment === 'center') {
                usePresentationStore.getState().addColumnsAroundImage(presentationId, slideId, layoutId, {
                    width: imageWidthPercent,
                    direction: 'both',
                });
            } else {
                let direction: 'right' | 'left' | 'both' | undefined;

                if (element.alignment === 'center') {
                    direction = 'both';
                } else if (element.alignment === 'right') {
                    direction = 'left';
                } else if (element.alignment === 'left') {
                    direction = 'right';
                }

                usePresentationStore.getState().addColumnsAroundImage(presentationId, slideId, layoutId, {
                    width: imageWidthPercent,
                    direction,
                });
            }
        }
    };

    return (
        <div className={styles.imageContainer}>
            <div
                ref={containerRef}
                className={`relative ${className} ${getAlignmentClass()}`}
                style={{
                    maxWidth: element.width ? `${element.width}px` : '100%',
                    cursor: 'default',
                }}
                onClick={handleClickImage}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 rounded">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                )}

                {error && <div className="text-red-500 text-center p-4 border border-red-200 rounded">{error}</div>}

                {isSelected && (
                    <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none z-10"></div>
                )}

                {element.src && isValidUrl(element.src) && (
                    <div className={`relative w-full ${styles.image}`}>
                        {!hasMultipleCells && leftTextWidth > 0 && (
                            <div
                                className={`${styles.addTextPlaceholder} ${styles.leftTextPlaceholder}`}
                                style={{
                                    width: `calc(${leftTextWidth}px - (var(--grid-padding) * 2))`,
                                }}
                                onClick={handleAddText}
                            >
                                Кликните для добавления текста
                            </div>
                        )}

                        <ImageComponent
                            ref={imageRef}
                            src={element.src || ''}
                            alt={element.alt || ''}
                            width={0}
                            height={0}
                            sizes="100vw"
                            style={{ width: '100%', height: 'auto' }}
                            className={`rounded shadow-sm ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />

                        {isSelected && (
                            <>
                                {/* Верхняя сторона */}
                                <div
                                    className={`${styles.dot} ${styles.dotTopMiddle}`}
                                    style={{ cursor: getResizeCursor('top') }}
                                    onMouseDown={e => handleResizeStart(e, 'top')}
                                />

                                {/* Правая сторона */}
                                <div
                                    className={`${styles.dot} ${styles.dotRightMiddle}`}
                                    style={{ cursor: getResizeCursor('right') }}
                                    onMouseDown={e => handleResizeStart(e, 'right')}
                                />

                                {/* Нижняя сторона */}
                                <div
                                    className={`${styles.dot} ${styles.dotBottomMiddle}`}
                                    style={{ cursor: getResizeCursor('bottom') }}
                                    onMouseDown={e => handleResizeStart(e, 'bottom')}
                                />

                                {/* Левая сторона */}
                                <div
                                    className={`${styles.dot} ${styles.dotLeftMiddle}`}
                                    style={{ cursor: getResizeCursor('left') }}
                                    onMouseDown={e => handleResizeStart(e, 'left')}
                                />

                                {/* Верхний левый угол */}
                                <div
                                    className={`${styles.dot} ${styles.dotTopLeft}`}
                                    style={{ cursor: getResizeCursor('top-left') }}
                                    onMouseDown={e => handleResizeStart(e, 'top-left')}
                                />

                                {/* Верхний правый угол */}
                                <div
                                    className={`${styles.dot} ${styles.dotTopRight}`}
                                    style={{ cursor: getResizeCursor('top-right') }}
                                    onMouseDown={e => handleResizeStart(e, 'top-right')}
                                />

                                {/* Нижний левый угол */}
                                <div
                                    className={`${styles.dot} ${styles.dotBottomLeft}`}
                                    style={{ cursor: getResizeCursor('bottom-left') }}
                                    onMouseDown={e => handleResizeStart(e, 'bottom-left')}
                                />

                                {/* Нижний правый угол */}
                                <div
                                    className={`${styles.dot} ${styles.dotBottomRight}`}
                                    style={{ cursor: getResizeCursor('bottom-right') }}
                                    onMouseDown={e => handleResizeStart(e, 'bottom-right')}
                                />
                            </>
                        )}

                        {!hasMultipleCells && rightTextWidth > 0 && (
                            <div
                                className={`${styles.addTextPlaceholder} ${styles.rightTextPlaceholder}`}
                                style={{
                                    width: `calc(${rightTextWidth}px - (var(--grid-padding) * 2))`,
                                }}
                                onClick={handleAddText}
                            >
                                Кликните для добавления текста
                            </div>
                        )}
                    </div>
                )}

                {(!element.src || !isValidUrl(element.src)) && (
                    <div className={`text-gray-500 text-center p-4 border border-gray-200 rounded`}>
                        {element.alt || 'Изображение не найдено'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Image;
