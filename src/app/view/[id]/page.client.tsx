/* eslint-disable jsx-a11y/interactive-supports-focus */
'use client';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlideViewer } from '@/components/viewer';
import styles from './page.module.css';
import { useColorMode } from '@/components/ui/color-mode';
import { ReadOnlyProvider } from '@/contexts/ReadOnlyContext';
import screenfull from 'screenfull';
import { FullscreenIcon } from 'lucide-react';
import { IPresentation } from '@/types';
import { Theme } from '@/types/theme';

type Props = {
    presentation: IPresentation;
    theme: Theme;
};

export default function PresentationView({ presentation, theme }: Props) {
    const { colorMode } = useColorMode();

    const [isFullscreen, setIsFullscreen] = useState(false);

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const visibleSlides = useMemo(() => presentation?.slides.filter(s => !s.hidden) || [], [presentation]);

    // Distance the user must scroll before changing slide
    const SCROLL_DISTANCE_THRESHOLD = 1000;
    const SCROLL_IDLE_THRESHOLD = 300;
    const PROGRESS_HOLD_DURATION = 3000; // Hold progress for 3 seconds after stopping

    const [scrollProgress, setScrollProgress] = useState(0);
    const [scrollDirection, setScrollDirection] = useState<'next' | 'prev' | null>(null);
    const isScrollBlocked = useRef(false);
    const lastWheelRef = useRef<number>(0);
    const accumulatedScrollDistanceRef = useRef(0);
    const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const progressHoldTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollDirectionRef = useRef<'next' | 'prev' | null>(null);
    const slideWrapperRef = useRef<HTMLDivElement>(null);

    // Check if we're on the client side
    // const isClient = typeof window !== 'undefined';

    // Cleanup function to clear timeouts when component unmounts
    useEffect(() => {
        return () => {
            // Clear all timeouts
            if (idleTimeoutRef.current) {
                clearTimeout(idleTimeoutRef.current);
            }
            if (progressHoldTimeoutRef.current) {
                clearTimeout(progressHoldTimeoutRef.current);
            }
        };
    }, []);

    const handleNextSlide = useCallback(() => {
        if (presentation && currentSlideIndex < visibleSlides.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1);
            // Block scroll and hide progress bar after slide change
            isScrollBlocked.current = true;
            setScrollProgress(0);
            setScrollDirection(null);
        }
    }, [currentSlideIndex, presentation, visibleSlides.length]);

    const handlePrevSlide = useCallback(() => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
            // Block scroll and hide progress bar after slide change
            isScrollBlocked.current = true;
            setScrollProgress(0);
            setScrollDirection(null);
        }
    }, [currentSlideIndex]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                handleNextSlide();
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                handlePrevSlide();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [currentSlideIndex, handleNextSlide, handlePrevSlide, presentation]);

    // Check if we're at the edge of scrollable content
    const checkEdgePosition = useCallback(() => {
        // Check document/window scroll instead of wrapper scroll
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        const isScrollable = scrollHeight > clientHeight;

        const EDGE_THRESHOLD = 3;
        const atTop = scrollTop <= EDGE_THRESHOLD;
        const atBottom = scrollTop + clientHeight >= scrollHeight - EDGE_THRESHOLD;

        let isAtEdge = false;
        let direction: 'next' | 'prev' | null = null;

        if (!isScrollable) {
            // If content is not scrollable, we're always "at edge" for both directions
            isAtEdge = true;
            direction = null; // Can go either direction
        } else if (atTop) {
            isAtEdge = true;
            direction = 'prev';
        } else if (atBottom) {
            isAtEdge = true;
            direction = 'next';
        }

        // Update refs
        isAtEdgeRef.current = isAtEdge;
        edgeDirectionRef.current = direction;

        // Update debug info
        setDebugInfo(prev => ({
            ...prev,
            isAtEdge,
            direction,
            scrollTop: Math.round(scrollTop),
            scrollHeight,
            clientHeight,
            isScrollable,
            accumulatedDistance: accumulatedScrollDistanceRef.current,
            isBlocked: isScrollBlocked.current,
        }));
    }, []);

    // Reset scroll position and unblock when slide changes
    useEffect(() => {
        // Always scroll to top when slide changes
        console.log('scroll to top');
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 300);

        // Unblock scroll after a short delay to allow slide transition to complete
        const unblockTimer = setTimeout(() => {
            isScrollBlocked.current = false;
            // Update edge position after unblocking
            setTimeout(checkEdgePosition, 100);
        }, 500); // Shorter delay than SCROLL_BLOCK_DURATION

        return () => {
            clearTimeout(unblockTimer);
        };
    }, [currentSlideIndex, checkEdgePosition]);

    // Use refs for real-time edge detection (avoid state update delays)
    const isAtEdgeRef = useRef(false);
    const edgeDirectionRef = useRef<'next' | 'prev' | null>(null);
    const [debugInfo, setDebugInfo] = useState({
        isAtEdge: false,
        direction: null as 'next' | 'prev' | null,
        scrollTop: 0,
        scrollHeight: 0,
        clientHeight: 0,
        isScrollable: false,
        scrollProgress: 0,
        accumulatedDistance: 0,
        isBlocked: false,
    });

    // Single wheel event handler for both normal scrolling and slide transitions
    useEffect(() => {
        const resetSlideTransition = () => {
            accumulatedScrollDistanceRef.current = 0;
            lastWheelRef.current = 0;
            setScrollProgress(0);
            setScrollDirection(null);
            scrollDirectionRef.current = null;
            if (idleTimeoutRef.current) {
                clearTimeout(idleTimeoutRef.current);
                idleTimeoutRef.current = null;
            }
            if (progressHoldTimeoutRef.current) {
                clearTimeout(progressHoldTimeoutRef.current);
                progressHoldTimeoutRef.current = null;
            }

            // Update debug info
            setDebugInfo(prev => ({
                ...prev,
                scrollProgress: 0,
                accumulatedDistance: 0,
            }));
        };

        const onWheel = (e: WheelEvent) => {
            if (!presentation || isScrollBlocked.current) return;

            // Always check edge position on wheel events
            checkEdgePosition();

            // If not at edge, allow normal scrolling
            if (!isAtEdgeRef.current) {
                resetSlideTransition();
                return;
            }

            const dir: 'next' | 'prev' = e.deltaY > 0 ? 'next' : 'prev';

            // Check if we're at presentation boundaries
            const isLastSlide = currentSlideIndex >= visibleSlides.length - 1;
            const isFirstSlide = currentSlideIndex <= 0;

            if ((dir === 'next' && isLastSlide) || (dir === 'prev' && isFirstSlide)) {
                resetSlideTransition();
                return;
            }

            // For scrollable content, check if the edge direction matches scroll direction
            if (edgeDirectionRef.current !== null && edgeDirectionRef.current !== dir) {
                resetSlideTransition();
                return;
            }

            // We're at the edge and scrolling in the right direction - start slide transition
            e.preventDefault();

            // Clear progress hold timeout if user starts scrolling again
            if (progressHoldTimeoutRef.current) {
                clearTimeout(progressHoldTimeoutRef.current);
                progressHoldTimeoutRef.current = null;
            }

            // Reset if direction changed
            if (scrollDirectionRef.current && dir !== scrollDirectionRef.current) {
                resetSlideTransition();
            }

            // Accumulate scroll distance
            const scrollDistance = Math.abs(e.deltaY);
            accumulatedScrollDistanceRef.current += scrollDistance;

            scrollDirectionRef.current = dir;
            setScrollDirection(dir);
            lastWheelRef.current = Date.now();

            const progress = accumulatedScrollDistanceRef.current / SCROLL_DISTANCE_THRESHOLD;
            setScrollProgress(Math.min(progress, 1));

            // Update debug info with current scroll progress
            setDebugInfo(prev => ({
                ...prev,
                scrollProgress: Math.min(progress, 1),
                accumulatedDistance: accumulatedScrollDistanceRef.current,
            }));

            if (progress >= 1) {
                // Trigger slide transition
                if (dir === 'next') {
                    handleNextSlide();
                } else {
                    handlePrevSlide();
                }
                resetSlideTransition();
                return;
            }

            // Clear existing idle timeout
            if (idleTimeoutRef.current) {
                clearTimeout(idleTimeoutRef.current);
            }

            // Set timeout to hold progress for 3 seconds after user stops scrolling
            idleTimeoutRef.current = setTimeout(() => {
                progressHoldTimeoutRef.current = setTimeout(resetSlideTransition, PROGRESS_HOLD_DURATION);
            }, SCROLL_IDLE_THRESHOLD);
        };

        window.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            window.removeEventListener('wheel', onWheel);
            resetSlideTransition();
        };
    }, [presentation, handleNextSlide, handlePrevSlide, currentSlideIndex, visibleSlides.length, checkEdgePosition]);

    // Monitor content size changes and initial load
    useEffect(() => {
        // Use ResizeObserver to detect when document content height changes
        const resizeObserver = new ResizeObserver(() => {
            // Small delay to ensure layout is complete
            setTimeout(checkEdgePosition, 50);
        });

        // Observe the document body instead of wrapper
        resizeObserver.observe(document.body);

        // Also listen to window resize events
        const handleResize = () => {
            setTimeout(checkEdgePosition, 50);
        };

        window.addEventListener('resize', handleResize);

        // Listen to scroll events to update edge detection in real-time
        const handleScroll = () => {
            checkEdgePosition();
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // Check initial position after a delay to ensure content is loaded
        const timeoutId = setTimeout(checkEdgePosition, 200);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId);
        };
    }, [checkEdgePosition, currentSlideIndex]);

    const handleFullscreen = () => {
        screenfull.request();
        setIsFullscreen(true);
    };

    // const currentSlide = visibleSlides[currentSlideIndex];
    // const pageStyle = useMemo(() => {
    //     const style: React.CSSProperties = {};
    //     if (currentSlide?.templateType === 'imageBackground' && currentSlide?.imageUrl) {
    //         style.backgroundImage = `url(${currentSlide.imageUrl})`;
    //         style.backgroundSize = 'cover';
    //         style.backgroundPosition = 'center';
    //         style.backgroundRepeat = 'no-repeat';
    //     } else if (currentSlide?.background?.type === 'color') {
    //         style.backgroundColor = currentSlide.background.value;
    //     } else {
    //         style.backgroundColor = 'var(--presentation-slide-background)';
    //     }
    //     return style;
    // }, [currentSlide]);

    if (visibleSlides.length === 0) return <div className={styles.loadingContainer}>Нет видимых слайдов</div>;

    return (
        <ReadOnlyProvider isReadOnly={true}>
            <div className={`${styles.container} ${colorMode === 'dark' ? 'dark' : ''}`}>
                <main className={styles.main} data-read-only="true">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentSlideIndex}
                            className={styles.slidePage}
                            initial={{ opacity: 0, y: scrollDirection === 'next' ? 50 : -50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: scrollDirection === 'next' ? -50 : 50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <SlideViewer
                                theme={theme}
                                slide={visibleSlides[currentSlideIndex]}
                                fullPage={true}
                                primaryAccentColor={theme?.colors.primaryAccent || '#000000'}
                                wrapperRef={slideWrapperRef}
                            />
                        </motion.div>
                    </AnimatePresence>
                    <div className={styles.progressBar}>
                        {visibleSlides.map((_, index) => {
                            let progressBlockClass = styles.progressBlock;
                            if (index < currentSlideIndex) {
                                progressBlockClass += ` ${styles.progressBlockPast}`;
                            } else if (index === currentSlideIndex) {
                                progressBlockClass += ` ${styles.progressBlockCurrent}`;
                            }

                            return <div key={index} className={progressBlockClass}></div>;
                        })}
                    </div>
                    {scrollProgress > 0 && (
                        <div
                            className={`${styles.scrollProgressContainer} ${
                                scrollDirection === 'next' ? styles.scrollProgressBottom : styles.scrollProgressTop
                            }`}
                        >
                            <svg className={styles.scrollProgressSvg} viewBox="0 0 36 36" width="40" height="40">
                                <circle cx="18" cy="18" r="16" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="16"
                                    stroke="#3b82f6"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray="100"
                                    strokeDashoffset={100 - scrollProgress * 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                    )}
                    {/* Debug info panel - hidden by default to avoid hydration mismatch */}
                    {process.env.NODE_ENV === 'development' && (
                        <div
                            style={{
                                position: 'fixed',
                                top: '10px',
                                right: '10px',
                                background: 'rgba(0, 0, 0, 0.8)',
                                color: 'white',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                zIndex: 1000,
                                pointerEvents: 'none',
                                lineHeight: '1.3',
                                minWidth: '200px',
                                display: 'block',
                            }}
                        >
                            <div>
                                <strong>Slide:</strong> {currentSlideIndex + 1}/{visibleSlides.length}
                            </div>
                            <div>
                                <strong>At Edge:</strong> {debugInfo.isAtEdge ? 'YES' : 'NO'}
                            </div>
                            <div>
                                <strong>Direction:</strong> {debugInfo.direction || 'both'}
                            </div>
                            <div>
                                <strong>Scrollable:</strong> {debugInfo.isScrollable ? 'YES' : 'NO'}
                            </div>
                            <div>
                                <strong>Scroll:</strong> {debugInfo.scrollTop}/
                                {debugInfo.scrollHeight - debugInfo.clientHeight}
                            </div>
                            <div>
                                <strong>Size:</strong> {debugInfo.clientHeight}px (view)
                            </div>
                            <div>
                                <strong>Content:</strong> {debugInfo.scrollHeight}px (total)
                            </div>
                            <div>
                                <strong>Progress:</strong> {Math.round(debugInfo.scrollProgress * 100)}%
                            </div>
                            <div>
                                <strong>Distance:</strong> {debugInfo.accumulatedDistance}/1000
                            </div>
                            <div>
                                <strong>Blocked:</strong> {debugInfo.isBlocked ? 'YES' : 'NO'}
                            </div>
                        </div>
                    )}

                    {screenfull.isEnabled && !isFullscreen && (
                        <div className={styles.fullscreenButton}>
                            <button onClick={handleFullscreen}>
                                <FullscreenIcon size={24} color="#fff" />
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </ReadOnlyProvider>
    );
}
