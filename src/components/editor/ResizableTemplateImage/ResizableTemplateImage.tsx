import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import styles from './ResizableTemplateImage.module.css';
import deepEqual from 'deep-equal';

// Minimum size in percentage for image sections
const MIN_SIZE = 10;
// Maximum size in percentage for image sections
const MAX_SIZE = 90;

interface ResizableTemplateImageProps {
    presentationId: string;
    slideId: string;
    templateType: string;
    imageUrl: string;
    initialImageStyle: React.CSSProperties;
}

const ResizableTemplateImage: React.FC<ResizableTemplateImageProps> = ({
    presentationId,
    slideId,
    templateType,
    imageUrl,
    // defaultSize,
    initialImageStyle,
}) => {
    const updateSlide = usePresentationStore(state => state.updateSlide);
    const slide = usePresentationStore(
        useCallback(state => state.getSlide(presentationId, slideId), [presentationId, slideId])
    );

    // Get stored size or use default
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const storedSize =
        slide?.imageSize ||
        (slide?.templateType === 'imageTop' || slide?.templateType === 'imageBottom'
            ? { height: '33%' }
            : { width: '33%' });

    // State for tracking resize operation
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<'horizontal' | 'vertical' | null>(null);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentSize, setCurrentSize] = useState(storedSize);

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
        if (currentSize.width !== storedSize.width || currentSize.height !== storedSize.height) {
            updateSlide(presentationId, slideId, {
                imageSize: currentSize,
            });
        }
    }, [currentSize, isResizing, presentationId, slideId, storedSize, updateSlide]);

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
            case 'imageBottom':
                return ['top'];
            case 'imageLeft':
                return ['right'];
            case 'imageRight':
                return ['left'];
            default:
                return [];
        }
    }, [templateType]);

    // Compute final image style including stored dimensions
    const imageStyle = {
        ...initialImageStyle,
        ...(currentSize.width && { width: currentSize.width }),
        ...(currentSize.height && { height: currentSize.height }),
        zIndex: 10,
    };

    // Handle resize movement
    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current);
        }

        animationFrameIdRef.current = requestAnimationFrame(() => {
            if (!imageRef.current) return;

            const parentRect = imageRef.current.parentElement?.getBoundingClientRect();
            if (!parentRect) return;

            const deltaX = e.clientX - startPosRef.current.x;
            const deltaY = e.clientY - startPosRef.current.y;

            if (resizeDirectionRef.current === 'horizontal') {
                let newWidth;

                if (templateTypeRef.current === 'imageLeft') {
                    // For left image, increase width when dragging right
                    const baseWidth = parseFloat(currentSizeRef.current.width || '33%');
                    const parentWidth = parentRect.width;
                    const pixelWidth = (baseWidth / 100) * parentWidth + deltaX;
                    newWidth = `${Math.max(MIN_SIZE, Math.min(MAX_SIZE, (pixelWidth / parentWidth) * 100))}%`;
                } else if (templateTypeRef.current === 'imageRight') {
                    // For right image, increase width when dragging left
                    const baseWidth = parseFloat(currentSizeRef.current.width || '33%');
                    const parentWidth = parentRect.width;
                    const pixelWidth = (baseWidth / 100) * parentWidth - deltaX;
                    newWidth = `${Math.max(MIN_SIZE, Math.min(MAX_SIZE, (pixelWidth / parentWidth) * 100))}%`;
                }

                if (newWidth) {
                    setCurrentSize(prev => ({ ...prev, width: newWidth }));
                }
            }

            if (resizeDirectionRef.current === 'vertical') {
                let newHeight;

                if (templateTypeRef.current === 'imageTop') {
                    // For top image, increase height when dragging down
                    const baseHeight = parseFloat(currentSizeRef.current.height || '33%');
                    const parentHeight = parentRect.height;
                    const pixelHeight = (baseHeight / 100) * parentHeight + deltaY;
                    newHeight = `${Math.max(MIN_SIZE, Math.min(MAX_SIZE, (pixelHeight / parentHeight) * 100))}%`;
                } else if (templateTypeRef.current === 'imageBottom') {
                    const baseHeight = parseFloat(currentSizeRef.current.height || '33%');
                    const parentHeight = parentRect.height;
                    const pixelHeight = (baseHeight / 100) * parentHeight - deltaY;
                    newHeight = `${Math.max(MIN_SIZE, Math.min(MAX_SIZE, (pixelHeight / parentHeight) * 100))}%`;
                }

                if (newHeight) {
                    setCurrentSize(prev => ({ ...prev, height: newHeight }));
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

        setResizeDirection(null);
        resizeDirectionRef.current = null;
        setIsResizing(false);

        // Remove global event listeners
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
    }, []);

    // Handle resize start - must be defined after handleResizeMove and handleResizeEnd
    const handleResizeStart = useCallback(
        (e: React.MouseEvent, direction: 'horizontal' | 'vertical') => {
            e.preventDefault();
            e.stopPropagation();

            const initialPos = { x: e.clientX, y: e.clientY };
            startPosRef.current = initialPos;
            setStartPos(initialPos);
            
            setResizeDirection(direction);
            resizeDirectionRef.current = direction;
            setIsResizing(true);

            // Add global event listeners for mouse move and up
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
        },
        [handleResizeMove, handleResizeEnd]
    );

    // Handle keyboard resize
    const handleKeyboardResize = useCallback(
        (e: React.KeyboardEvent, direction: 'horizontal' | 'vertical', action: 'increase' | 'decrease') => {
            e.preventDefault();
            e.stopPropagation();

            if (!imageRef.current) return;

            const step = e.shiftKey ? 5 : 2; // Larger step with shift key
            const parentRect = imageRef.current.parentElement?.getBoundingClientRect();
            if (!parentRect) return;

            if (direction === 'horizontal') {
                const currentWidth = parseFloat(currentSize.width || '33%');
                const newWidth =
                    action === 'increase'
                        ? `${Math.min(MAX_SIZE, currentWidth + step)}%`
                        : `${Math.max(MIN_SIZE, currentWidth - step)}%`;

                setCurrentSize(prev => ({ ...prev, width: newWidth }));
            } else {
                const currentHeight = parseFloat(currentSize.height || '33%');
                const newHeight =
                    action === 'increase'
                        ? `${Math.min(MAX_SIZE, currentHeight + step)}%`
                        : `${Math.max(MIN_SIZE, currentHeight - step)}%`;

                setCurrentSize(prev => ({ ...prev, height: newHeight }));
            }

            // Immediately update the slide with the new size
            updateSlide(presentationId, slideId, {
                imageSize: {
                    ...currentSize,
                    ...(direction === 'horizontal' ? { width: currentSize.width } : { height: currentSize.height }),
                },
            });
        },
        [currentSize, presentationId, slideId, updateSlide]
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
                    setResizeDirection(null);
                    break;
                case 'Enter':
                case ' ': // Space key
                    // Toggle resizing mode
                    e.preventDefault();
                    if (!isResizing) {
                        setIsResizing(true);
                        setResizeDirection(direction);
                    } else {
                        setIsResizing(false);
                        setResizeDirection(null);
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

    // Render template image with resize handles
    return (
        <div
            ref={imageRef}
            className={styles.templateImage}
            style={imageStyle}
            aria-label={`Resizable ${templateType} image template`}
            role="region"
        >
            <img
                src={imageUrl}
                alt={`Template ${templateType}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {resizeHandles.includes('left') && (
                <div
                    className={styles.resizeHandleLeft}
                    onMouseDown={e => handleResizeStart(e, 'horizontal')}
                    onKeyDown={e => handleKeyDown(e, 'horizontal')}
                    tabIndex={0}
                    role="slider"
                    aria-label="Resize image width"
                    aria-valuemin={MIN_SIZE}
                    aria-valuemax={MAX_SIZE}
                    aria-valuenow={parseInt(currentSize.width?.toString() || '33')}
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
                    aria-label="Resize image width"
                    aria-valuemin={MIN_SIZE}
                    aria-valuemax={MAX_SIZE}
                    aria-valuenow={parseInt(currentSize.width?.toString() || '33')}
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
                    aria-label="Resize image height"
                    aria-valuemin={MIN_SIZE}
                    aria-valuemax={MAX_SIZE}
                    aria-valuenow={parseInt(currentSize.height?.toString() || '33')}
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
                    aria-label="Resize image height"
                    aria-valuemin={MIN_SIZE}
                    aria-valuemax={MAX_SIZE}
                    aria-valuenow={parseInt(currentSize.height?.toString() || '33')}
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
