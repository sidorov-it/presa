/* eslint-disable jsx-a11y/interactive-supports-focus */
'use client';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { SlideViewer } from '@/components/viewer';
import styles from './page.module.css';
import ThemeStylesApplier from '@/components/viewer/theme/ThemeStylesApplier';
import { useColorMode } from '@/components/ui/color-mode';
import { ReadOnlyProvider } from '@/contexts/ReadOnlyContext';
import { useThemeStore } from '@/store/themeStore';
import { usePresentationStore } from '@/store/presentationStore';
import screenfull from 'screenfull';
import { FullscreenIcon } from 'lucide-react';
import { clearAllThemeStyles } from '@/utils/themeUtils';
import { Theme } from '@/types/theme';
import NotFoundPage from '@/components/NotFoundPage/NotFoundPage';

export default function PresentationView() {
    const params = useParams();
    const { id } = params;

    const { colorMode } = useColorMode();

    const [isFullscreen, setIsFullscreen] = useState(false);
    const loadPresentation = usePresentationStore(state => state.loadPresentation);
    const checkPresentationExists = usePresentationStore(state => state.checkPresentationExists);

    // Get presentation from store instead of local state
    const presentation = usePresentationStore(state => state.getPresentation(id as string));

    const themes = useThemeStore(state => state.themes);
    const loadThemes = useThemeStore(state => state.loadThemes);
    const currentTheme = useThemeStore(state => state.currentTheme) as Theme;
    const setCurrentTheme = useThemeStore(state => state.setCurrentTheme);
    const defaultThemes = useThemeStore(state => state.defaultThemes);

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const visibleSlides = useMemo(() => presentation?.slides.filter(s => !s.hidden) || [], [presentation]);

    // Distance the user must scroll before changing slide
    const SCROLL_DISTANCE_THRESHOLD = 1000;
    const SCROLL_IDLE_THRESHOLD = 300;
    const PROGRESS_HOLD_DURATION = 3000; // Hold progress for 3 seconds after stopping

    const [scrollProgress, setScrollProgress] = useState(0);
    const [scrollDirection, setScrollDirection] = useState<'next' | 'prev' | null>(null);
    // const [isScrollBlocked, setIsScrollBlocked] = useState(false);
    const isScrollBlocked = useRef(false);
    const lastWheelRef = useRef<number>(0);
    const accumulatedScrollDistanceRef = useRef(0);
    const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const progressHoldTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // const scrollBlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollDirectionRef = useRef<'next' | 'prev' | null>(null);
    const slideWrapperRef = useRef<HTMLDivElement>(null);
    const EDGE_THRESHOLD = 20;
    const SCROLL_BLOCK_DURATION = 2000; // Block scroll for 2 seconds after slide change

    // Cleanup function to clear theme styles when component unmounts
    useEffect(() => {
        return () => {
            clearAllThemeStyles();
            // Clear all timeouts
            if (idleTimeoutRef.current) {
                clearTimeout(idleTimeoutRef.current);
            }
            if (progressHoldTimeoutRef.current) {
                clearTimeout(progressHoldTimeoutRef.current);
            }
            // if (scrollBlockTimeoutRef.current) {
            //     clearTimeout(scrollBlockTimeoutRef.current);
            // }
        };
    }, []);

    const handleNextSlide = useCallback(() => {
        if (presentation && currentSlideIndex < visibleSlides.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1);
            // Block scroll and hide progress bar after slide change
            isScrollBlocked.current = true;
            setScrollProgress(0);
            setScrollDirection(null);
            // if (scrollBlockTimeoutRef.current) {
            //     clearTimeout(scrollBlockTimeoutRef.current);
            // }

            setTimeout(() => {
                console.log('setTimeout scrollBlockTimeoutRef.current');
                isScrollBlocked.current = false;
            }, SCROLL_BLOCK_DURATION);
        }
    }, [currentSlideIndex, presentation]);

    const handlePrevSlide = useCallback(() => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
            // Block scroll and hide progress bar after slide change
            isScrollBlocked.current = true;
            setScrollProgress(0);
            setScrollDirection(null);
            // if (scrollBlockTimeoutRef.current) {
            //     clearTimeout(scrollBlockTimeoutRef.current);
            // }

            setTimeout(() => {
                console.log('setTimeout scrollBlockTimeoutRef.current');
                isScrollBlocked.current = false;
            }, SCROLL_BLOCK_DURATION);
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

    useEffect(() => {
        const resetScroll = () => {
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
        };

        const onWheel = (e: WheelEvent) => {
            if (!presentation || isScrollBlocked.current) return;
            const dir: 'next' | 'prev' = e.deltaY > 0 ? 'next' : 'prev';

            // Check if we're at the boundaries where scrolling is not possible
            const isLastSlide = currentSlideIndex >= visibleSlides.length - 1;
            const isFirstSlide = currentSlideIndex <= 0;

            if ((dir === 'next' && isLastSlide) || (dir === 'prev' && isFirstSlide)) {
                resetScroll();
                return;
            }

            const wrapper = slideWrapperRef.current;
            if (!wrapper) return;
            const atBottom = wrapper.scrollTop + wrapper.clientHeight >= wrapper.scrollHeight - EDGE_THRESHOLD;
            const atTop = wrapper.scrollTop <= EDGE_THRESHOLD;
            const atEdge = dir === 'next' ? atBottom : atTop;

            if (!atEdge) {
                resetScroll();
                return;
            }

            e.preventDefault();
            const now = Date.now();

            // Clear progress hold timeout if user starts scrolling again
            if (progressHoldTimeoutRef.current) {
                clearTimeout(progressHoldTimeoutRef.current);
                progressHoldTimeoutRef.current = null;
            }

            // Reset if direction changed
            if (scrollDirectionRef.current && dir !== scrollDirectionRef.current) {
                resetScroll();
            }

            // Accumulate scroll distance based on wheel delta
            const scrollDistance = Math.abs(e.deltaY);
            accumulatedScrollDistanceRef.current += scrollDistance;

            scrollDirectionRef.current = dir;
            setScrollDirection(dir);
            lastWheelRef.current = now;

            const progress = accumulatedScrollDistanceRef.current / SCROLL_DISTANCE_THRESHOLD;
            setScrollProgress(Math.min(progress, 1));

            if (progress >= 1) {
                if (dir === 'next') {
                    handleNextSlide();
                } else {
                    handlePrevSlide();
                }
                resetScroll();
                return;
            }

            // Clear existing idle timeout
            if (idleTimeoutRef.current) {
                clearTimeout(idleTimeoutRef.current);
            }

            // Set timeout to hold progress for 3 seconds after user stops scrolling
            idleTimeoutRef.current = setTimeout(() => {
                console.log('setTimeout idleTimeoutRef.current');
                progressHoldTimeoutRef.current = setTimeout(resetScroll, PROGRESS_HOLD_DURATION);
            }, SCROLL_IDLE_THRESHOLD);
        };

        window.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            window.removeEventListener('wheel', onWheel);
            resetScroll();
            // scrollBlockTimeoutRef.current = null;
            // if (scrollBlockTimeoutRef.current) {
            //     clearTimeout(scrollBlockTimeoutRef.current);
            // }
        };
    }, [presentation, handleNextSlide, handlePrevSlide]);

    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Load presentation data only once when component mounts or ID changes
    useEffect(() => {
        if (!id) return;

        const load = async () => {
            try {
                // Check if presentation already exists in store
                if (checkPresentationExists(id as string)) {
                    setIsLoading(false);
                    return;
                }

                // If not in store, load it
                const loadedPresentation = await loadPresentation(id as string);
                if (!loadedPresentation) {
                    setNotFound(true);
                }
            } catch (error) {
                console.error('Failed to load presentation:', error);
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [id, loadPresentation, checkPresentationExists]);

    // Apply theme when presentation is loaded or themes change
    useEffect(() => {
        if (!presentation) return;

        const savedTheme =
            themes.find(theme => theme.id === presentation.themeId) ||
            defaultThemes.find(theme => theme.id === presentation.themeId);
        if (savedTheme) {
            setCurrentTheme(savedTheme);
        } else {
            setCurrentTheme(defaultThemes[0]);
        }

        return () => {
            setCurrentTheme(undefined);
        };
    }, [presentation, themes, setCurrentTheme, defaultThemes]);

    // Load themes separately
    useEffect(() => {
        loadThemes().catch(error => {
            console.error('Failed to load themes:', error);
        });
    }, [loadThemes]);

    const loadingUI = useMemo(
        () => (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
            </div>
        ),
        []
    );


    const handleFullscreen = () => {
        screenfull.request();
        setIsFullscreen(true);
    };

    const currentSlide = visibleSlides[currentSlideIndex];
    const pageStyle = useMemo(() => {
        const style: React.CSSProperties = {};
        if (currentSlide?.templateType === 'imageBackground' && currentSlide?.imageUrl) {
            style.backgroundImage = `url(${currentSlide.imageUrl})`;
            style.backgroundSize = 'cover';
            style.backgroundPosition = 'center';
            style.backgroundRepeat = 'no-repeat';
        } else if (currentSlide?.background?.type === 'color') {
            style.backgroundColor = currentSlide.background.value;
        } else {
            style.backgroundColor = 'var(--presentation-slide-background)';
        }
        return style;
    }, [currentSlide]);

    if (isLoading) return loadingUI;
    if (notFound || !presentation) return <NotFoundPage />;
    if (visibleSlides.length === 0) return <div className={styles.loadingContainer}>Нет видимых слайдов</div>;

    return (
        <ReadOnlyProvider isReadOnly={true}>
            <ThemeStylesApplier theme={currentTheme} backgroundSettings={presentation.backgroundSettings}>
                <div className={`${styles.container} ${colorMode === 'dark' ? 'dark' : ''}`} style={pageStyle}>
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
                                    theme={currentTheme}
                                    slide={visibleSlides[currentSlideIndex]}
                                    fullPage={true}
                                    primaryAccentColor={currentTheme?.colors.primaryAccent || '#000000'}
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
                        {screenfull.isEnabled && !isFullscreen && (
                            <div className={styles.fullscreenButton}>
                                <button onClick={handleFullscreen}>
                                    <FullscreenIcon size={24} color="#fff" />
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </ThemeStylesApplier>
        </ReadOnlyProvider>
    );
}
