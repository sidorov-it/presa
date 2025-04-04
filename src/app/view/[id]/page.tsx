import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { parsePresentation } from '@/utils/json';
import SlideViewer from '@/components/viewer/SlideViewer';
import { Theme } from '@/types/theme';
import { Slide } from '@/types';

// Define metadata for the page
export const generateMetadata = async (props: { params: Promise<{ id: string }> }) => {
    const params = await props.params;
    try {
        const presentation = await prisma.presentation.findUnique({
            where: { id: params.id },
            select: { title: true }
        });

        return {
            title: presentation?.title || 'Presentation Viewer',
            description: 'View the presentation in read-only mode'
        };
    } catch (error: any) {
        console.error('Failed to load presentation:', error);
        return {
            title: 'Presentation Viewer',
            description: 'View presentation content'
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

        // Fetch theme if available
        if (presentation.themeId) {
            const themeData = await prisma.theme.findUnique({
                where: { id: presentation.themeId }
            });

            if (themeData) {
                theme = {
                    id: themeData.id,
                    name: themeData.name,
                    colors: themeData.colors,
                    typography: themeData.typography,
                    // design: themeData.design,
                    // logo: themeData.logo,
                    // description: themeData.description,
                    createdAt: themeData.createdAt,
                    updatedAt: themeData.updatedAt,
                };
            }
        }
    } catch (error) {
        console.error('Failed to load presentation:', error);
        notFound();
    }

    // Generate CSS variables for theme
    const getThemeStyles = () => {
        if (!theme) return '';

        const cssVars = [];

        // Add color variables
        if (theme.colors) {
            Object.entries(theme.colors).forEach(([key, value]) => {
                cssVars.push(`--${key}: ${value};`);
            });
        }

        // Add font variables
        if (theme.fonts) {
            Object.entries(theme.fonts).forEach(([key, value]) => {
                cssVars.push(`--${key}: ${value};`);
            });
        }

        return cssVars.join(' ');
    };

    return (
        (<div className="min-h-screen w-full py-10 px-4 themed-page" style={{ ...(theme ? { style: getThemeStyles() } : {}) }}>
            <div className="max-w-6xl mx-auto space-y-20">
                {presentation.slides.map((slide: Slide, index: number) => (
                    <div key={slide.id} id={`slide-${index + 1}`} className="scroll-mt-10">
                        <SlideViewer slide={slide} />
                    </div>
                ))}
            </div>
        </div>)
    );
} 