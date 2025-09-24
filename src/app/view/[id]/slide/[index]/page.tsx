import { notFound } from 'next/navigation';
import { Theme } from '@/types/theme';
import { prisma } from '@/lib/prisma';
import { parsePresentation } from '@/utils/json';
import SlideViewer from '@/components/viewer/SlideViewer/SlideViewer';
// import ReadOnlyProvider from '@/components/providers/ReadOnlyProvider';
// import ThemeStylesApplier from '@/components/theme/ThemeStylesApplier/ThemeStylesApplier';
// import ViewerProvider from '@/components/providers/ViewerProvider';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { shouldHideBranding } from '@/utils/subscriptions';
import { ReadOnlyProvider } from '@/contexts/ReadOnlyContext';
import { ThemeStylesApplier, ViewerProvider } from '@/components/viewer';
import { Slide } from '@/types';

export default async function SlidePage(props: {
    params: Promise<{ id: string; index: string }>;
    searchParams: Promise<{ pdf?: string; hideBranding?: string; hasActiveSubscription?: string }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { id, index } = params;
    const { pdf, hideBranding, hasActiveSubscription } = searchParams;

    const slideIndex = parseInt(index, 10);
    const isPdfExport = pdf === 'true';

    // Get session for subscription checking
    const session = await getServerSession(authOptions);

    // Получаем презентацию из базы данных
    const presentation = await prisma.presentation.findUnique({
        where: { id },
        include: {
            user: true,
            // theme: true,
        },
    });

    if (!presentation) {
        notFound();
    }

    // Парсим слайды
    const parsedPresentation = parsePresentation(presentation);
    const slides = parsedPresentation.slides;

    // Filter out hidden slides for viewer
    const visibleSlides = slides.filter((slide: Slide) => !slide.hidden);

    if (slideIndex < 0 || slideIndex >= visibleSlides.length) {
        notFound();
    }

    const slide = visibleSlides[slideIndex];

    // Получаем тему
    let theme: Theme | null = null;
    if (presentation?.themeId) {
        theme = await prisma.theme.findUnique({
            where: { id: presentation.themeId },
        });
    } else {
        theme = await prisma.theme.findFirst({
            where: { isDefault: true },
        });
    }

    if (!theme) {
        notFound();
    }

    // Check if branding should be hidden for this user
    let shouldHideBrandingFlag = false;
    if (isPdfExport) {
        // For PDF export, check if hideBranding parameter is passed from the API
        if (hideBranding === 'true') {
            shouldHideBrandingFlag = true;
        } else if (session?.user?.id) {
            // Fallback: check if the presentation owner has an active subscription
            const presentationOwnerId = presentation.userId;
            shouldHideBrandingFlag = await shouldHideBranding(presentationOwnerId);
        }
    }

    let hasActiveSubscriptionFlag = false;
    if (hasActiveSubscription === 'true') {
        hasActiveSubscriptionFlag = true;
    }

    return (
        <ReadOnlyProvider isReadOnly={true}>
            <ThemeStylesApplier theme={theme} backgroundSettings={presentation.backgroundSettings || {}}>
                <ViewerProvider>
                    <div
                        className="slide-page-container"
                        style={{
                            width: '100%',
                            height: isPdfExport ? 'auto' : '100vh',
                            minHeight: isPdfExport ? 'auto' : '100vh',
                            display: 'flex',
                            alignItems: isPdfExport ? 'flex-start' : 'center',
                            justifyContent: 'center',
                            backgroundColor: isPdfExport ? 'white' : '#f8f9fa',
                            overflow: isPdfExport ? 'visible' : 'hidden',
                            paddingTop: isPdfExport ? '20px' : '0',
                            paddingBottom: isPdfExport ? '20px' : '0',
                        }}
                    >
                        <SlideViewer
                            theme={theme}
                            slide={slide}
                            primaryAccentColor={theme.colors.primaryAccent}
                            fullPage={true}
                            isPdfExport={isPdfExport}
                            hideBranding={shouldHideBrandingFlag}
                            hasActiveSubscription={hasActiveSubscriptionFlag}
                            currentSlideIndex={slideIndex}
                            totalSlides={visibleSlides.length}
                            globalHeaderFooterConfig={presentation.headerFooterConfig}
                        />
                    </div>
                </ViewerProvider>
            </ThemeStylesApplier>
        </ReadOnlyProvider>
    );
}
