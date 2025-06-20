import { prisma } from '@/lib/prisma';
import { SlideViewer } from '@/components/viewer';
import ViewerProvider from '@/components/viewer/ViewerProvider';
import { notFound } from 'next/navigation';
import { createNewTheme } from '@/constants/defaultTheme';
import themeToCSSVariables from '@/utils/themeCssVariables';

interface PageProps {
    params: { id: string; index: string };
}

export default async function SlidePage({ params }: PageProps) {
    const { id, index } = params;
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

    let theme = null;
    if (presentation.themeId) {
        theme = await prisma.theme.findUnique({ where: { id: presentation.themeId } });
    }

    const finalTheme = theme || createNewTheme();
    const themeStyle = themeToCSSVariables(finalTheme, presentation.backgroundSettings || undefined);

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

    return (
        <ViewerProvider>
            <div style={themeStyle}>
                <div style={pageStyle}>
                    <SlideViewer slide={slide} fullPage primaryAccentColor={finalTheme.colors.primaryAccent} />
                </div>
            </div>
        </ViewerProvider>
    );
}
