import { prisma } from '@/lib/prisma';
import { SlideViewer } from '@/components/viewer';
import ViewerProvider from '@/components/viewer/ViewerProvider';
import { notFound } from 'next/navigation';
import { Theme } from '@/types/theme';
import type { Metadata } from 'next';
import createNewTheme from '@/utils/theme/createNewTheme';
import ThemeStylesApplier from '@/components/viewer/theme/ThemeStylesApplier';
import { ReadOnlyProvider } from '@/contexts/ReadOnlyContext';

export const metadata: Metadata = {
    title: 'Слайд презентации',
    description: 'Просмотр отдельного слайда презентации',
};

export default async function SlidePage(props: {
    params: Promise<{ id: string; index: string }>;
    searchParams: Promise<{ pdf?: string }>;
}) {
    const { id, index } = await props.params;
    const searchParams = await props.searchParams;
    const isPdfExport = searchParams.pdf === 'true';

    const slideIndex = parseInt(index, 10);

    const presentation = await prisma.presentation.findUnique({
        where: { id },
    });

    if (!presentation) {
        notFound();
    }

    const slides =
        typeof presentation.slides === 'string'
            ? JSON.parse(presentation.slides as unknown as string)
            : (presentation.slides as any);

    const visibleSlides = slides.filter((s: any) => !s.hidden);
    const slide = visibleSlides[slideIndex];

    if (!slide) {
        notFound();
    }

    let theme: Theme | null = null;
    if (presentation.themeId) {
        const dbTheme = await prisma.theme.findUnique({ where: { id: presentation.themeId } });
        if (dbTheme) {
            // Convert database theme to proper Theme type
            theme = {
                ...dbTheme,
                description: dbTheme.description || undefined, // Convert null to undefined
            } as Theme;
        }
    }

    const finalTheme: Theme = theme || {
        ...createNewTheme(),
        id: 'default-theme',
    };

    // Type-safe conversion of backgroundSettings to handle null values
    let backgroundSettings;
    if (presentation.backgroundSettings) {
        backgroundSettings = {
            backgroundColor: presentation.backgroundSettings.backgroundColor || undefined,
            backgroundImage: presentation.backgroundSettings.backgroundImage || undefined,
        };
    }

    const pageStyle: React.CSSProperties = {};
    if (slide.templateType === 'imageBackground' && slide.imageUrl) {
        pageStyle.backgroundImage = `url(${slide.imageUrl})`;
        pageStyle.backgroundSize = 'cover';
        pageStyle.backgroundPosition = 'center';
        pageStyle.backgroundRepeat = 'no-repeat';
    } else if (slide.background?.type === 'color') {
        pageStyle.backgroundColor = slide.background.value;
    } else {
        pageStyle.backgroundColor = 'var(--presentation-slide-background)';
    }

    // PDF-specific styles
    if (isPdfExport) {
        pageStyle.width = '100vw';
        pageStyle.margin = '0';
        pageStyle.padding = '0';
        pageStyle.overflow = 'visible';
    }

    return (
        <ReadOnlyProvider isReadOnly={true}>
            <ThemeStylesApplier theme={finalTheme} backgroundSettings={backgroundSettings}>
                <ViewerProvider>
                    <div
                        style={
                            {
                                width: '100%',
                                minHeight: '100vh',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'var(--presentation-page-background-color)',
                                backgroundImage: 'var(--presentation-page-background-image)',
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                                '--card-width': 'min(100vw, calc(100vh * 1.7777777777777777))',
                                '--card-height': 'calc(var(--card-width) / 1.7777777777777777 - 64px)',
                                '--card-font-scale': 'calc(var(--card-width) / 1032)', // Scale fonts based on slide width
                                '--editor-width': '1032px', // Standard editor width
                                '--card-min-height':
                                    'calc(min(var(--card-width), var(--editor-width)) / 1.7777777777777777)',
                                '--card-max-width': 'var(--editor-width)',
                                '--media-scale': 'min(1, var(--card-font-scale, 1))',
                                boxSizing: 'border-box',
                                position: 'relative',
                            } as React.CSSProperties
                        }
                        data-read-only="true"
                    >
                        <SlideViewer
                            theme={finalTheme}
                            slide={slide}
                            primaryAccentColor={finalTheme.colors.primaryAccent}
                            fullPage={true}
                            isPdfExport={isPdfExport}
                        />
                    </div>
                </ViewerProvider>
            </ThemeStylesApplier>
        </ReadOnlyProvider>
    );
}
