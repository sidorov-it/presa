/* eslint-disable jsx-a11y/interactive-supports-focus */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
// import Editor from '@/components/editor/Editor';
import { IPresentation } from '@/types';
import { useThemeStore } from '@/store/themeStore';
import styles from './page.module.css';
import ThemeStylesApplier from '@/components/viewer/theme/ThemeStylesApplier';
import { PresentationViewer } from '@/components/viewer';

export default function PresentationEditorPage() {
    const params = useParams();
    const { id } = params;

    // Access store values individually to prevent unnecessary re-renders
    const loadPresentation = usePresentationStore(state => state.loadPresentation);

    const themes = useThemeStore(state => state.themes);
    const loadThemes = useThemeStore(state => state.loadThemes);
    const currentTheme = useThemeStore(state => state.currentTheme);
    const setCurrentTheme = useThemeStore(state => state.setCurrentTheme);

    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [presentation, setPresentation] = useState<IPresentation | null>(null);

    // Load presentation data only once when component mounts or ID changes
    useEffect(() => {
        if (status === 'loading' || !id) return;

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

    // Memoize the loading and not found UI to prevent re-renders
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
        <ThemeStylesApplier theme={currentTheme}>
            <PresentationViewer presentation={presentation} />
        </ThemeStylesApplier>
    );
}
