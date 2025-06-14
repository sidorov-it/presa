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
    const checkPresentationExists = usePresentationStore(state => state.checkPresentationExists);

    // Get presentation from store instead of local state
    const presentation = usePresentationStore(state => state.getPresentation(id as string));

    const themes = useThemeStore(state => state.themes);
    const loadThemes = useThemeStore(state => state.loadThemes);
    const currentTheme = useThemeStore(state => state.currentTheme);
    const setCurrentTheme = useThemeStore(state => state.setCurrentTheme);

    const tiptapRefs = useRef<TipTapRefs>({
        editors: {},
        editorRefs: [],
    });

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

    return (
        <ReadOnlyProvider isReadOnly={true}>
            <ThemeStylesApplier
                theme={currentTheme}
                backgroundSettings={presentation.backgroundSettings}
                className={styles.container}
            >
                <div className={colorMode === 'dark' ? 'dark' : ''}>
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
            </ThemeStylesApplier>
        </ReadOnlyProvider>
    );
}
