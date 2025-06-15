/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useCallback, useEffect, useState } from 'react';
import { IPresentation } from '@/types';
import SlideViewer from './SlideViewer/SlideViewer';

interface FullscreenViewerProps {
    presentation: IPresentation;
    initialSlideIndex?: number;
    onClose?: () => void;
}

const FullscreenViewer: React.FC<FullscreenViewerProps> = ({ presentation, initialSlideIndex = 0, onClose }) => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlideIndex);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [mouseMoveTimeout, setMouseMoveTimeout] = useState<NodeJS.Timeout | null>(null);

    // Handle entering and exiting fullscreen
    const toggleFullscreen = useCallback(() => {
        if (!isFullscreen) {
            const docElm = document.documentElement;
            if (docElm.requestFullscreen) {
                docElm.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }, [isFullscreen]);

    // Watch for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Auto-hide controls after inactivity
    useEffect(() => {
        const handleMouseMove = () => {
            setControlsVisible(true);

            if (mouseMoveTimeout) {
                clearTimeout(mouseMoveTimeout);
            }

            const timeout = setTimeout(() => {
                setControlsVisible(false);
            }, 3000);

            setMouseMoveTimeout(timeout);
        };

        document.addEventListener('mousemove', handleMouseMove);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            if (mouseMoveTimeout) {
                clearTimeout(mouseMoveTimeout);
            }
        };
    }, [mouseMoveTimeout]);

    // Handle navigation between slides
    const handleNextSlide = useCallback(() => {
        if (currentSlideIndex < presentation.slides.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1);
        }
    }, [currentSlideIndex, presentation.slides.length]);

    const handlePreviousSlide = useCallback(() => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
        }
    }, [currentSlideIndex]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent | KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
                handleNextSlide();
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                handlePreviousSlide();
            } else if (e.key === 'Escape') {
                if (isFullscreen) {
                    document.exitFullscreen();
                }
                if (onClose) {
                    onClose();
                }
            } else if (e.key === 'F' || e.key === 'f') {
                toggleFullscreen();
            }
        },
        [handleNextSlide, handlePreviousSlide, isFullscreen, onClose, toggleFullscreen]
    );

    // Add global keyboard listener
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentSlideIndex, presentation.slides.length, isFullscreen, handleKeyDown]);

    // Current slide
    const currentSlide = presentation.slides[currentSlideIndex];

    if (!currentSlide) {
        return <div>No slides to display</div>;
    }

    return (
        <div
            className="fullscreen-viewer"
            onKeyDown={handleKeyDown}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div style={{ flex: 1, width: '100%', position: 'relative' }}>
                <SlideViewer slide={currentSlide} presentationId={presentation.id} />
            </div>

            {/* IPresentation controls */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '0.5rem',
                    transition: 'opacity 0.3s ease',
                    opacity: controlsVisible ? 1 : 0,
                }}
            >
                <button
                    onClick={handlePreviousSlide}
                    disabled={currentSlideIndex === 0}
                    aria-label="Previous slide"
                    style={{
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        background: 'transparent',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        cursor: 'pointer',
                        opacity: currentSlideIndex === 0 ? 0.5 : 1,
                    }}
                >
                    ←
                </button>

                <div style={{ color: 'white' }}>
                    {currentSlideIndex + 1} / {presentation.slides.length}
                </div>

                <button
                    onClick={handleNextSlide}
                    disabled={currentSlideIndex === presentation.slides.length - 1}
                    aria-label="Next slide"
                    style={{
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        background: 'transparent',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        cursor: 'pointer',
                        opacity: currentSlideIndex === presentation.slides.length - 1 ? 0.5 : 1,
                    }}
                >
                    →
                </button>

                <button
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    style={{
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        background: 'transparent',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        cursor: 'pointer',
                        marginLeft: '1rem',
                    }}
                >
                    {isFullscreen ? '⤓' : '⤒'}
                </button>

                {onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Close presentation"
                        style={{
                            padding: '0.5rem',
                            borderRadius: '0.25rem',
                            background: 'transparent',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            cursor: 'pointer',
                        }}
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};

export default FullscreenViewer;
