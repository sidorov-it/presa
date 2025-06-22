import { prisma } from '@/lib/prisma';
import { SlideViewer } from '@/components/viewer';
import ViewerProvider from '@/components/viewer/ViewerProvider';
import { notFound } from 'next/navigation';
import { createNewTheme } from '@/constants/defaultTheme';
import themeToCSSVariables from '@/utils/themeCssVariables';
import { Theme } from '@/types/theme';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Слайд презентации',
    description: 'Просмотр отдельного слайда презентации',
};

export default async function SlidePage(props: {
    params: Promise<{ id: string; index: string }>;
    searchParams: Promise<{ pdf?: string }>;
}) {
    // const { id, index } = params;
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

    const slide = slides[slideIndex];

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

    const themeStyle = themeToCSSVariables(finalTheme, backgroundSettings);

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
        // pageStyle.height = 'auto';
        // pageStyle.minHeight = 'auto';
        pageStyle.margin = '0';
        pageStyle.padding = '0';
        pageStyle.overflow = 'visible';
    }

    return (
        <ViewerProvider>
            <div style={themeStyle}>
                <div style={pageStyle}>
                    <SlideViewer
                        theme={finalTheme}
                        slide={slide}
                        primaryAccentColor={finalTheme.colors.primaryAccent}
                        fullPage={true}
                        isPdfExport={isPdfExport}
                    />
                </div>
            </div>
        </ViewerProvider>
    );
}
