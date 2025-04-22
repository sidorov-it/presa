import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { parsePresentation } from '@/utils/json';
import SlideViewer from '@/components/viewer/SlideViewer';
import { Theme } from '@/types/theme';
import { Slide } from '@/types';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import styles from './page.module.css';

// Define metadata for the page
export const generateMetadata = async (props: { params: Promise<{ id: string }> }) => {
    const params = await props.params;
    try {
        const presentation = await prisma.presentation.findUnique({
            where: { id: params.id },
            select: { title: true },
        });

        return {
            title: presentation?.title || 'Presentation Viewer',
            description: 'View the presentation in read-only mode',
        };
    } catch (error: any) {
        console.error('Failed to load presentation:', error);
        return {
            title: 'Presentation Viewer',
            description: 'View presentation content',
        };
    }
};

// Server component for viewing a presentation
export default async function PresentationView(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    // Get presentation data from the database
    let presentation;
    let theme: Theme | null = null;

    try {
        // Fetch presentation from database
        const presentationData = await prisma.presentation.findUnique({
            where: { id: params.id },
        });

        if (!presentationData) {
            notFound();
        }

        // Parse the presentation data
        presentation = parsePresentation(presentationData);

        console.log('Presentation themeId:', presentation.themeId);

        // Fetch theme if available
        if (presentation.themeId) {
            try {
                // Directly fetch the theme using raw Prisma client to get full structure
                const themeData = (await prisma.theme.findUnique({
                    where: { id: presentation.themeId },
                })) as Theme;

                console.log('Theme data from DB:', JSON.stringify(themeData, null, 2));

                if (themeData) {
                    // Convert to proper Theme type with correct structure
                    theme = {
                        id: themeData.id,
                        name: themeData.name,
                        description: themeData.description || undefined,
                        logo: themeData.logo || undefined,
                        colors: themeData.colors,
                        typography: {
                            ...themeData.typography,
                            // Ensure numbers are parsed correctly
                            headingWeight: Number(themeData.typography.headingWeight),
                            bodyWeight: Number(themeData.typography.bodyWeight),
                        },
                        design: {
                            slide: themeData.design.slide,
                            blocks: {
                                ...themeData.design.blocks,
                            },
                            buttons: themeData.design.buttons,
                        },
                        createdAt: themeData.createdAt,
                        updatedAt: themeData.updatedAt,
                    };

                    console.log('Theme object created:', theme!.name);
                    console.log('Theme structure validation:', {
                        hasColors: !!theme!.colors,
                        hasTypography: !!theme!.typography,
                        hasDesign: !!theme!.design,
                        hasSlide: theme!.design && !!theme!.design.slide,
                        hasBlocks: theme!.design && !!theme!.design.blocks,
                        hasButtons: theme!.design && !!theme!.design.buttons,
                    });
                } else {
                    console.log('Theme not found in database');
                }
            } catch (themeError) {
                console.error('Error fetching theme:', themeError);
            }
        } else {
            console.log('No themeId in presentation');
        }
    } catch (error) {
        console.error('Failed to load presentation:', error);
        notFound();
    }

    return (
        <ThemeProvider initialTheme={theme}>
            <div className={styles.container}>
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
