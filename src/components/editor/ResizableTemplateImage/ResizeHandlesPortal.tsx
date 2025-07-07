import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './ResizableTemplateImage.module.css';

interface ResizeHandlesPortalProps {
    containerRef: React.RefObject<HTMLDivElement>;
    resizeHandles: string[];
    isVisible: boolean;
    onResizeStart: (e: React.MouseEvent, direction: 'horizontal' | 'vertical') => void;
    currentSize: { heightRatio?: number; widthRatio?: number };
    MIN_SIZE: number;
    MAX_SIZE: number;
    onHandleHover?: (isHovered: boolean) => void;
}

const ResizeHandlesPortal: React.FC<ResizeHandlesPortalProps> = ({
    containerRef,
    resizeHandles,
    isVisible,
    onResizeStart,
    currentSize,
    MIN_SIZE,
    MAX_SIZE,
    onHandleHover,
}) => {
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
    const [handlePositions, setHandlePositions] = useState<{
        left?: { top: number; left: number; width: number; height: number };
        right?: { top: number; left: number; width: number; height: number };
        top?: { top: number; left: number; width: number; height: number };
        bottom?: { top: number; left: number; width: number; height: number };
    }>({});
    const [actuallyVisible, setActuallyVisible] = useState(false);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Create portal container on mount
    useEffect(() => {
        const container = document.createElement('div');
        container.className = 'resize-handles-portal';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '50';
        document.body.appendChild(container);
        setPortalContainer(container);

        return () => {
            document.body.removeChild(container);
        };
    }, []);

    // Update handle positions when container position changes
    const updateHandlePositions = () => {
        if (!containerRef.current || !actuallyVisible) {
            setHandlePositions({});
            return;
        }

        const containerRect = containerRef.current.getBoundingClientRect();
        const handleSize = 4;
        const positions: typeof handlePositions = {};

        if (resizeHandles.includes('left')) {
            positions.left = {
                top: containerRect.top,
                left: containerRect.left - handleSize / 2,
                width: handleSize,
                height: containerRect.height,
            };
        }

        if (resizeHandles.includes('right')) {
            positions.right = {
                top: containerRect.top,
                left: containerRect.right - handleSize / 2,
                width: handleSize,
                height: containerRect.height,
            };
        }

        if (resizeHandles.includes('top')) {
            positions.top = {
                top: containerRect.top - handleSize / 2,
                left: containerRect.left,
                width: containerRect.width,
                height: handleSize,
            };
        }

        if (resizeHandles.includes('bottom')) {
            positions.bottom = {
                top: containerRect.bottom - handleSize / 2,
                left: containerRect.left,
                width: containerRect.width,
                height: handleSize,
            };
        }

        setHandlePositions(positions);
    };

    // Handle visibility with delay to prevent flickering
    useEffect(() => {
        if (isVisible) {
            // Clear any pending hide timeout
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
            setActuallyVisible(true);
        } else {
            // Add a small delay before hiding to prevent flickering
            hideTimeoutRef.current = setTimeout(() => {
                setActuallyVisible(false);
                setHandlePositions({});
            }, 100);
        }

        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
        };
    }, [isVisible]);

    // Update positions on visibility change, scroll, and resize
    useEffect(() => {
        if (!actuallyVisible) {
            setHandlePositions({});
            return;
        }

        updateHandlePositions();

        const handleScroll = () => updateHandlePositions();
        const handleResize = () => updateHandlePositions();

        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);

        // Use ResizeObserver to track container size changes
        let resizeObserver: ResizeObserver | null = null;
        if (containerRef.current) {
            resizeObserver = new ResizeObserver(updateHandlePositions);
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, [actuallyVisible, resizeHandles, containerRef]);

    if (!portalContainer || !actuallyVisible) {
        return null;
    }

    return createPortal(
        <>
            {handlePositions.left && (
                <div
                    className={`${styles.resizeHandleLeft} ${styles.portalResizeHandle}`}
                    style={{
                        position: 'fixed',
                        top: `${handlePositions.left.top}px`,
                        left: `${handlePositions.left.left}px`,
                        width: `${handlePositions.left.width}px`,
                        height: `${handlePositions.left.height}px`,
                        pointerEvents: 'auto',
                        opacity: 1,
                        backgroundColor: 'rgb(29, 155, 240)',
                        cursor: 'ew-resize',
                        zIndex: 1000,
                    }}
                    onMouseDown={e => onResizeStart(e, 'horizontal')}
                    onMouseEnter={() => onHandleHover?.(true)}
                    onMouseLeave={() => onHandleHover?.(false)}
                    tabIndex={0}
                    role="slider"
                    aria-label="Изменить ширину изображения"
                    aria-valuemin={MIN_SIZE}
                    aria-valuemax={MAX_SIZE}
                    aria-valuenow={Math.round((currentSize.widthRatio || 0.33) * 100)}
                    aria-orientation="horizontal"
                />
            )}

            {handlePositions.right && (
                <div
                    className={`${styles.resizeHandleRight} ${styles.portalResizeHandle}`}
                    style={{
                        position: 'fixed',
                        top: `${handlePositions.right.top}px`,
                        left: `${handlePositions.right.left}px`,
                        width: `${handlePositions.right.width}px`,
                        height: `${handlePositions.right.height}px`,
                        pointerEvents: 'auto',
                        opacity: 1,
                        backgroundColor: 'rgb(29, 155, 240)',
                        cursor: 'ew-resize',
                        zIndex: 1000,
                    }}
                    onMouseDown={e => onResizeStart(e, 'horizontal')}
                    onMouseEnter={() => onHandleHover?.(true)}
                    onMouseLeave={() => onHandleHover?.(false)}
                    tabIndex={0}
                    role="slider"
                    aria-label="Изменить ширину изображения"
                    aria-valuemin={MIN_SIZE}
                    aria-valuemax={MAX_SIZE}
                    aria-valuenow={Math.round((currentSize.widthRatio || 0.33) * 100)}
                    aria-orientation="horizontal"
                />
            )}

            {handlePositions.top && (
                <div
                    className={`${styles.resizeHandleTop} ${styles.portalResizeHandle}`}
                    style={{
                        position: 'fixed',
                        top: `${handlePositions.top.top}px`,
                        left: `${handlePositions.top.left}px`,
                        width: `${handlePositions.top.width}px`,
                        height: `${handlePositions.top.height}px`,
                        pointerEvents: 'auto',
                        opacity: 1,
                        backgroundColor: 'rgb(29, 155, 240)',
                        cursor: 'ns-resize',
                        zIndex: 1000,
                    }}
                    onMouseDown={e => onResizeStart(e, 'vertical')}
                    onMouseEnter={() => onHandleHover?.(true)}
                    onMouseLeave={() => onHandleHover?.(false)}
                    tabIndex={0}
                    role="slider"
                    aria-label="Изменить высоту изображения"
                    aria-valuemin={5}
                    aria-valuemax={100}
                    aria-valuenow={Math.round((currentSize.heightRatio || 0.33) * 100)}
                    aria-orientation="vertical"
                />
            )}

            {handlePositions.bottom && (
                <div
                    className={`${styles.resizeHandleBottom} ${styles.portalResizeHandle}`}
                    style={{
                        position: 'fixed',
                        top: `${handlePositions.bottom.top}px`,
                        left: `${handlePositions.bottom.left}px`,
                        width: `${handlePositions.bottom.width}px`,
                        height: `${handlePositions.bottom.height}px`,
                        pointerEvents: 'auto',
                        opacity: 1,
                        backgroundColor: 'rgb(29, 155, 240)',
                        cursor: 'ns-resize',
                        zIndex: 1000,
                    }}
                    onMouseDown={e => onResizeStart(e, 'vertical')}
                    onMouseEnter={() => onHandleHover?.(true)}
                    onMouseLeave={() => onHandleHover?.(false)}
                    tabIndex={0}
                    role="slider"
                    aria-label="Изменить высоту изображения"
                    aria-valuemin={5}
                    aria-valuemax={100}
                    aria-valuenow={Math.round((currentSize.heightRatio || 0.33) * 100)}
                    aria-orientation="vertical"
                />
            )}
        </>,
        portalContainer
    );
};

export default ResizeHandlesPortal;
