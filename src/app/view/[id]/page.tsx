/* eslint-disable jsx-a11y/interactive-supports-focus */
'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
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
    const loadDefaultThemes = useThemeStore(state => state.loadDefaultThemes);
    const currentTheme = useThemeStore(state => state.currentTheme);
    const setCurrentTheme = useThemeStore(state => state.setCurrentTheme);
    const defaultThemes = useThemeStore(state => state.defaultThemes);

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    // Cleanup function to clear theme styles when component unmounts
    useEffect(() => {
        return () => {
            clearAllThemeStyles();
        };
    }, []);

    const handleNextSlide = useCallback(() => {
        if (presentation && currentSlideIndex < presentation.slides.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1);
        }
    }, [currentSlideIndex, presentation]);

    const handlePrevSlide = useCallback(() => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
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
    }, [currentSlideIndex, presentation]);

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

        const savedTheme = themes.find(theme => theme.id === presentation.themeId);
        if (savedTheme) {
            setCurrentTheme(savedTheme);
        } else {
            setCurrentTheme(defaultThemes[0]);
        }

        return () => {
            setCurrentTheme(null);
        };
    }, [presentation, themes, setCurrentTheme, defaultThemes]);

    // Load themes separately
    useEffect(() => {
        loadThemes().catch(error => {
            console.error('Failed to load themes:', error);
        });
    }, [loadThemes]);

    useEffect(() => {
        loadDefaultThemes().catch(error => {
            console.error('Failed to load themes:', error);
        });
    }, [loadDefaultThemes]);

    const loadingUI = useMemo(
        () => (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
            </div>
        ),
        []
    );

    const notFoundUI = useMemo(
        () => (
            <div className={styles.notFoundContainer}>
                <h1 className={styles.notFoundTitle}>Presentation Not Found</h1>
                <p className={styles.notFoundText}>
                    The presentation you're looking for doesn't exist or you don't have access to it.
                </p>
            </div>
        ),
        []
    );

    const handleFullscreen = () => {
        screenfull.request();
        setIsFullscreen(true);
    };

    const currentSlide = presentation?.slides[currentSlideIndex];
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
    if (notFound || !presentation) return notFoundUI;

    return (
        <ReadOnlyProvider isReadOnly={true}>
            <ThemeStylesApplier theme={currentTheme} backgroundSettings={presentation.backgroundSettings}>
                <div className={`${styles.container} ${colorMode === 'dark' ? 'dark' : ''}`} style={pageStyle}>
                    <main className={styles.main} data-read-only="true">
                        <div className={styles.slidePage}>
                            <SlideViewer slide={presentation.slides[currentSlideIndex]} fullPage={true} />
                        </div>
                        <div className={styles.navControls}>
                            <button
                                onClick={handlePrevSlide}
                                disabled={currentSlideIndex === 0}
                                className={styles.navButton}
                                aria-label="Previous slide"
                            >
                                ←
                            </button>
                            <div className={styles.slideCounter}>
                                {currentSlideIndex + 1} / {presentation.slides.length}
                            </div>
                            <button
                                onClick={handleNextSlide}
                                disabled={currentSlideIndex === presentation.slides.length - 1}
                                className={styles.navButton}
                                aria-label="Next slide"
                            >
                                →
                            </button>
                        </div>
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
