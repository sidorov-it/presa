'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PresentationViewer } from '@/components/viewer';
import ThemeStylesApplier from '@/components/viewer/theme/ThemeStylesApplier';
import { IPresentation } from '@/types';
import { Theme } from '@/types/theme';
import { PdfExportDialog } from '@/components/export';
import styles from './page.module.css';

// Дефолтная тема, которая гарантированно будет работать
const DEFAULT_THEME: Theme = {
    id: 'default',
    name: 'Default Theme',
    description: 'Default theme for presentations',
    colors: {
        primaryAccent: '#3b82f6',
        additionalColors: ['#10b981', '#f59e0b', '#ef4444'],
        secondaryAccents: ['#10b981', '#f59e0b', '#ef4444'],
        shapesColor: '#3b82f6',
        headingColor: '#111827',
        textColor: '#374151',
        slideBackground: '#ffffff',
        pageBackground: {
            type: 'color',
            color: '#f9fafb',
            imageUrl: '',
        },
        accentBlocksColor: '#3b82f6',
        secondaryButtonColor: '#6b7280',
    },
    typography: {
        headingFont: 'Inter',
        headingWeight: 600,
        headingColor: '#111827',
        headingLineHeight: 1.2,
        headingLetterSpacing: 0,
        headingCapitalization: 'none',
        bodyFont: 'Inter',
        bodyWeight: 400,
        bodyColor: '#374151',
        bodyLineHeight: 1.5,
        bodyLetterSpacing: 0,
        bodyCapitalization: 'none',
    },
    design: {
        slide: {
            borderRadius: '0.5rem',
            shadow: 'sm',
            borderWidth: 'none',
            borderColor: '#e5e7eb',
            opacity: 1,
            imageShape: 'default',
        },
        blocks: {
            backgroundColor: '#3b82f6',
            backgroundFillType: 'fill',
            borderWidth: 'none',
            blockFillColorsType: 'primary',
            blockBackgroundCustomColors: ['#3b82f6', '#10b981', '#f59e0b'],
            shadow: 'none',
        },
        buttons: {
            buttonColor: '#3b82f6',
            buttonShape: 'rounded',
            linkColor: '#3b82f6',
        },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
};

export default function PresentationView() {
    const params = useParams();
    const { id } = params;

    const [presentation, setPresentation] = useState<IPresentation | null>(null);
    const [theme, setTheme] = useState<Theme | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Function to fetch presentation data
        const fetchPresentation = async () => {
            try {
                const response = await fetch(`/api/presentations/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to load presentation');
                }

                const fetchedPresentation = await response.json();
                setPresentation(fetchedPresentation);

                // Fetch theme if available
                if (fetchedPresentation.themeId) {
                    try {
                        const themeResponse = await fetch(`/api/themes/${fetchedPresentation.themeId}`);
                        if (themeResponse.ok) {
                            const themeData = await themeResponse.json();
                            console.log('Fetched theme data structure:', themeData);

                            // Check the structure of the theme data
                            let actualTheme = null;

                            if (themeData && themeData.theme && themeData.theme.id) {
                                // API returns { theme: Theme }
                                actualTheme = themeData.theme;
                                console.log('Using theme from themeData.theme structure');
                            } else if (themeData && themeData.id) {
                                // API returns Theme directly
                                actualTheme = themeData;
                                console.log('Using theme from direct structure');
                            } else {
                                console.warn('Invalid theme data structure, using default theme');
                                actualTheme = DEFAULT_THEME;
                            }

                            // Validate the theme has all required sections
                            if (!actualTheme.colors || !actualTheme.typography || !actualTheme.design) {
                                console.warn('Theme missing required sections, using default theme');
                                actualTheme = DEFAULT_THEME;
                            }

                            // Check for background image and log it
                            if (
                                actualTheme.colors &&
                                actualTheme.colors.pageBackground &&
                                actualTheme.colors.pageBackground.imageUrl
                            ) {
                                console.log(
                                    'Theme has background image URL:',
                                    actualTheme.colors.pageBackground.imageUrl
                                );

                                // Force apply the background to body
                                document.body.style.backgroundImage = `url(${actualTheme.colors.pageBackground.imageUrl})`;
                                document.body.style.backgroundSize = 'cover';
                                document.body.style.backgroundPosition = 'center';
                                document.body.style.backgroundRepeat = 'no-repeat';
                                document.body.style.backgroundAttachment = 'fixed';
                            } else {
                                console.log('Theme has no background image URL');
                            }

                            setTheme(actualTheme);
                        } else {
                            console.warn('Failed to fetch theme, using default theme');
                            setTheme(DEFAULT_THEME);
                        }
                    } catch (themeError) {
                        console.error('Error fetching theme:', themeError);
                        setTheme(DEFAULT_THEME);
                    }
                } else {
                    setTheme(DEFAULT_THEME);
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Error:', error);
                setError('Failed to load presentation');
                setIsLoading(false);
            }
        };

        if (id) {
            fetchPresentation();
        }
    }, [id]);

    // Get background style from theme
    const getBackgroundStyle = () => {
        if (!theme || !theme.colors || !theme.colors.pageBackground) {
            return {
                backgroundColor: '#f9fafb',
                backgroundImage: 'none',
            };
        }

        const bgStyle: React.CSSProperties = {
            backgroundColor: theme.colors.pageBackground.color || '#f9fafb',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
        };

        if (theme.colors.pageBackground.imageUrl) {
            bgStyle.backgroundImage = `url(${theme.colors.pageBackground.imageUrl})`;
        }

        return bgStyle;
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    if (error || !presentation) {
        return (
            <div className={styles.errorContainer}>
                <h1 className={styles.errorTitle}>Presentation Not Found</h1>
                <p className={styles.errorText}>
                    {error || "The presentation you're looking for doesn't exist or you don't have access to it."}
                </p>
            </div>
        );
    }

    return (
        <div className={styles.container} style={getBackgroundStyle()}>
            {/* Apply theme first, before any content rendering */}
            {theme && <ThemeStylesApplier theme={theme} />}

            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>{presentation.title}</h1>
                    {presentation.description && (
                        <p className={styles.description}>
                            {presentation.description.startsWith('Generated from prompt:')
                                ? presentation.description.replace('Generated from prompt:', 'Topic:').trim()
                                : presentation.description}
                        </p>
                    )}
                </div>

                <div className={styles.actions}>
                    <PdfExportDialog presentation={presentation} buttonText="Export to PDF" />
                </div>
            </div>

            <div className={styles.content}>
                {/* Используем PresentationViewer напрямую */}
                <PresentationViewer presentation={presentation} />
            </div>
        </div>
    );
}
