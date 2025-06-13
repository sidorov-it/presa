/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiLoader } from 'react-icons/fi';
import { ImageElement } from '@/types';
import { default as ImageComponent } from 'next/image';
import { usePresentationStore } from '@/store/presentationStore';
import { useMenuStore } from '@/store/menuStore';
import { useAIImageStore } from '@/store/aiImageStore';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder/ImagePlaceholder';

import styles from './Image.module.css';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

interface ImageProps {
    elementId: string;
    className?: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    hasMultipleCells?: boolean;
}

// Типы направлений изменения размера
type ResizeDirection = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const Image: React.FC<ImageProps> = ({
    elementId,
    className = '',
    presentationId,
    slideId,
    layoutId,
    hasMultipleCells,
}) => {
    const isReadOnly = useReadOnly();

    const element = usePresentationStore(state =>
        state.getElement(presentationId, slideId, layoutId, elementId)
    ) as ImageElement;

    // Check if element is generating (from AI store)
    const aiImageStore = useAIImageStore();
    const isGenerating = aiImageStore.isGenerating(elementId);
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
    const openMenu = useMenuStore(state => state.openMenu);

    const handleImageLoad = () => {
        // Сохраняем соотношение сторон изображения при загрузке
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setAspectRatio(rect.width / rect.height);
            setError(null);
        }
    };

    const handleImageError = () => {
        setError('Failed to load image');
    };

    useEffect(() => {
        if (element.src && isValidUrl(element.src)) {
            setError(null);
        }
    }, [element.src]);

    const handleClickImage = (e: React.MouseEvent) => {
        if (isReadOnly) {
            return;
        }

        e.stopPropagation();
        setIsSelected(true);

        openMenu({
            slideId: slideId,
            elementId: elementId,
            layoutId: layoutId,
            elementType: 'element',
            isTextEditor: false,
        });
    };

    useEffect(() => {
        if (isReadOnly) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsSelected(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isReadOnly]);

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
    const handleResizeMove = useCallback(
        (e: MouseEvent) => {
            if (!resizing || !resizeDirection || !containerRef.current) {
                return;
            }

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
        },
        [resizing, resizeDirection, startX, startY, startWidth, startHeight, aspectRatio]
    );

    // Handle resize end
    const handleResizeEnd = useCallback(() => {
        if (!resizing) return;

        setResizing(false);
        setResizeDirection(null);

        // Save the new width to the element data
        if (containerRef.current && presentationId && slideId && layoutId) {
            const newWidth = containerRef.current.clientWidth;
            updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId: element.id,
                data: { width: newWidth },
            });
        }
    }, [resizing, presentationId, slideId, layoutId, updateElement, element.id]);

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
                return styles.left;
            case 'center':
                return styles.center;
            case 'right':
                return styles.right;
            default:
                return styles.center; // Default to center alignment
        }
    };

    const isValidUrl = (url: string) => {
        // Allow relative URLs starting with / or ./
        if (url.startsWith('/') || url.startsWith('./')) {
            return true;
        }

        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    let leftTextWidth = 0;
    let rightTextWidth = 0;

    if (
        !hasMultipleCells &&
        containerRef.current?.parentElement &&
        imageRef.current &&
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
        if (isReadOnly) {
            return;
        }

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

                if (element.alignment === 'right') {
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

    const handleUpdateLink = (link: string, uploaded: boolean) => {
        updateElement({
            presentationId,
            slideId,
            layoutId,
            elementId: element.id,
            data: { src: link, uploaded },
        });
    };

    return (
        <div className={styles.imageContainer}>
            <div
                ref={containerRef}
                className={`${className} ${getAlignmentClass()}`}
                style={{
                    maxWidth: element.width ? `${element.width}px` : '100%',
                    cursor: 'default',
                }}
                onClick={handleClickImage}
            >
                {!isReadOnly && error && <div className={styles.error}>{error}</div>}

                {/* AI Generation Loading State */}
                {isGenerating && (
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}>
                            <FiLoader className={styles.spinningIcon} />
                        </div>
                        <p className={styles.loadingText}>Генерируем изображение...</p>
                    </div>
                )}

                {!isGenerating && !isReadOnly && (!element.src || !isValidUrl(element.src)) && (
                    <ImagePlaceholder
                        imageUrl={element.src || ''}
                        onClearImage={() => {
                            updateElement({
                                presentationId,
                                slideId,
                                layoutId,
                                elementId: element.id,
                                data: { src: '' },
                            });
                        }}
                        onUpdateLink={(link: string, uploaded: boolean) => handleUpdateLink(link, uploaded)}
                    />
                )}

                {!isGenerating && element.src && isValidUrl(element.src) && !error && (
                    <div className={`${styles.imageWrapper}`}>
                        {!hasMultipleCells && leftTextWidth > 0 && (
                            <div
                                className={`${styles.addTextPlaceholder} ${styles.leftTextPlaceholder}`}
                                style={{
                                    width: `calc(${leftTextWidth}px - (var(--grid-padding) * 2))`,
                                }}
                                onClick={handleAddText}
                            >
                                {isReadOnly ? '' : 'Кликните для добавления текста'}
                            </div>
                        )}

                        <div style={{ position: 'relative' }}>
                            <ImageComponent
                                ref={imageRef}
                                src={element.src}
                                alt={element.alt || ''}
                                width={0}
                                height={0}
                                sizes="100vw"
                                style={{ width: '100%', height: 'auto' }}
                                className={styles.image}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                            />
                            {isSelected && <div className={styles.selectedBorder}></div>}
                        </div>

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
                                {isReadOnly ? '' : 'Кликните для добавления текста'}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Image;
