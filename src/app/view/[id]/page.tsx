'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SlideViewer from '@/components/viewer/SlideViewer';
import { IPresentation, Slide } from '@/types';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Theme } from '@/types/theme';
import { PdfExportDialog } from '@/components/export';
import styles from './page.module.css';

// Define metadata for the page
export const generateMetadata = async (props: { params: Promise<{ id: string }> }) => {
    const params = await props.params;
    try {
        const presentation = await fetch(`/api/presentations/${params.id}`);
        if (!presentation.ok) {
            throw new Error('Failed to load presentation');
        }

        const data = await presentation.json();
        const title = data.presentation?.title || 'Presentation Viewer';
        const description = 'View the presentation in read-only mode';

        return {
            title,
            description,
        };
    } catch (error: any) {
        console.error('Failed to load presentation:', error);
        return {
            title: 'Presentation Viewer',
            description: 'View presentation content',
        };
    }
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

                const data = await response.json();
                setPresentation(data.presentation);

                // Fetch theme if available
                if (data.presentation.themeId) {
                    try {
                        const themeResponse = await fetch(`/api/themes/${data.presentation.themeId}`);
                        if (themeResponse.ok) {
                            const themeData = await themeResponse.json();
                            setTheme(themeData.theme);
                        }
                    } catch (themeError) {
                        console.error('Error fetching theme:', themeError);
                    }
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
        <ThemeProvider initialTheme={theme}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>{presentation.title}</h1>

                    <div className={styles.actions}>
                        <PdfExportDialog presentation={presentation} buttonText="Export to PDF" />
                    </div>
                </div>

                <div className={styles.content}>
                    <div className={styles.slideList}>
                        {presentation.slides.map((slide: Slide, index: number) => (
                            <div key={slide.id} id={`slide-${index + 1}`} className={styles.slideWrapper}>
                                <SlideViewer slide={slide} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ThemeProvider>
    );
}
