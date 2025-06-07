/* eslint-disable jsx-a11y/interactive-supports-focus */
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
// import Editor from '@/components/editor/Editor';
import Editor from '@/components/editor/Editor/Editor';
import { IPresentation, TipTapRefs } from '@/types';
import Link from 'next/link';
import styles from './page.module.css';
import ThemeStylesApplier from '@/components/viewer/theme/ThemeStylesApplier';
import { useColorMode } from '@/components/ui/color-mode';
import { ReadOnlyProvider } from '@/contexts/ReadOnlyContext';
import { useThemeStore } from '@/store/themeStore';
import { usePresentationStore } from '@/store/presentationStore';
import { PdfExportButton } from '@/components/export';
import Logo from '@/components/icons/Logo/Logo';

export default function PresentationView() {
    const params = useParams();
    const { id } = params;

    const { colorMode } = useColorMode();

    const loadPresentation = usePresentationStore(state => state.loadPresentation);

    const themes = useThemeStore(state => state.themes);
    const loadThemes = useThemeStore(state => state.loadThemes);
    const currentTheme = useThemeStore(state => state.currentTheme);
    const setCurrentTheme = useThemeStore(state => state.setCurrentTheme);

    const tiptapRefs = useRef<TipTapRefs>({
        editors: {},
        editorRefs: [],
    });

    const [presentation, setPresentation] = useState<IPresentation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    // Load presentation data only once when component mounts or ID changes
    useEffect(() => {
        const load = async () => {
            try {
                const loadedPresentation = await loadPresentation(id as string);
                if (!loadedPresentation) {
                    setNotFound(true);
                } else {
                    setPresentation(loadedPresentation);
                }
            } catch (error) {
                console.error('Failed to load presentation:', error);
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [id, loadPresentation]);

    // Apply theme when presentation is loaded or themes change
    useEffect(() => {
        if (!presentation || !presentation.themeId) return;

        const savedTheme = themes.find(theme => theme.id === presentation.themeId);
        if (savedTheme) {
            setCurrentTheme(savedTheme);
        }
    }, [presentation, themes, setCurrentTheme]);

    // Load themes separately
    useEffect(() => {
        loadThemes().catch(error => {
            console.error('Failed to load themes:', error);
        });
    }, [loadThemes]);

    // useEffect(() => {
    //     // Function to fetch presentation data
    //     const fetchPresentation = async () => {
    //         try {
    //             const response = await fetch(`/api/presentations/${id}`);
    //             if (!response.ok) {
    //                 throw new Error('Failed to load presentation');
    //             }

    //             const fetchedPresentation = await response.json();
    //             setPresentation(fetchedPresentation);

    //             // Fetch theme if available
    //             if (fetchedPresentation.themeId) {
    //                 try {
    //                     const themeResponse = await fetch(`/api/themes/${fetchedPresentation.themeId}`);
    //                     if (themeResponse.ok) {
    //                         const themeData = await themeResponse.json();
    //                         console.log('Fetched theme data structure:', themeData);

    //                         // Check the structure of the theme data
    //                         let actualTheme = null;

    //                         if (themeData && themeData.theme && themeData.theme.id) {
    //                             // API returns { theme: Theme }
    //                             actualTheme = themeData.theme;
    //                             console.log('Using theme from themeData.theme structure');
    //                         } else if (themeData && themeData.id) {
    //                             // API returns Theme directly
    //                             actualTheme = themeData;
    //                             console.log('Using theme from direct structure');
    //                         } else {
    //                             console.warn('Invalid theme data structure, using default theme');
    //                             actualTheme = DEFAULT_THEME;
    //                         }

    //                         // Validate the theme has all required sections
    //                         if (!actualTheme.colors || !actualTheme.typography || !actualTheme.design) {
    //                             console.warn('Theme missing required sections, using default theme');
    //                             actualTheme = DEFAULT_THEME;
    //                         }

    //                         // Check for background image and log it
    //                         if (
    //                             actualTheme.colors &&
    //                             actualTheme.colors.pageBackground &&
    //                             actualTheme.colors.pageBackground.imageUrl
    //                         ) {
    //                             console.log(
    //                                 'Theme has background image URL:',
    //                                 actualTheme.colors.pageBackground.imageUrl
    //                             );

    //                             // Force apply the background to body
    //                             document.body.style.backgroundImage = `url(${actualTheme.colors.pageBackground.imageUrl})`;
    //                             document.body.style.backgroundSize = 'cover';
    //                             document.body.style.backgroundPosition = 'center';
    //                             document.body.style.backgroundRepeat = 'no-repeat';
    //                             document.body.style.backgroundAttachment = 'fixed';
    //                         } else {
    //                             console.log('Theme has no background image URL');
    //                         }

    //                         setTheme(actualTheme);
    //                     } else {
    //                         console.warn('Failed to fetch theme, using default theme');
    //                         setTheme(DEFAULT_THEME);
    //                     }
    //                 } catch (themeError) {
    //                     console.error('Error fetching theme:', themeError);
    //                     setTheme(DEFAULT_THEME);
    //                 }
    //             } else {
    //                 setTheme(DEFAULT_THEME);
    //             }

    //             setIsLoading(false);
    //         } catch (error) {
    //             console.error('Error:', error);
    //             setError('Failed to load presentation');
    //             setIsLoading(false);
    //         }
    //     };

    //     if (id) {
    //         fetchPresentation();
    //     }
    // }, [id]);

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

    if (isLoading) return loadingUI;
    if (notFound || !presentation) return notFoundUI;

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    if (!presentation) {
        return (
            <div className={styles.errorContainer}>
                <h1 className={styles.errorTitle}>Presentation Not Found</h1>
                <p className={styles.errorText}>
                    {"The presentation you're looking for doesn't exist or you don't have access to it."}
                </p>
            </div>
        );
    }

    return (
        <ReadOnlyProvider isReadOnly={true}>
            <ThemeStylesApplier theme={currentTheme} backgroundSettings={presentation.backgroundSettings} />
            <div className={`${styles.container} ${colorMode === 'dark' ? 'dark' : ''}`}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.headerLeft}>
                            <Link href="/dashboard" className={styles.logo}>
                                <Logo size="md" />
                            </Link>
                        </div>
                        <div className={styles.headerRight}>
                            <div className={styles.actions}>
                                <PdfExportButton
                                    presentation={presentation}
                                    buttonText="Скачать PDF"
                                    loadingText="Скачивание..."
                                    filename={`${presentation.title || 'presentation'}.pdf`}
                                />
                            </div>
                        </div>
                    </div>
                </header>
                <main className={styles.main} data-read-only="true">
                    <Editor presentationId={presentation.id} tiptapRefs={tiptapRefs} />
                </main>

                <footer className={styles.footer}>
                    <div className={styles.footerContent}>Presa - Create beautiful presentations with AI</div>
                </footer>
            </div>
        </ReadOnlyProvider>
    );
}
