import { notFound } from 'next/navigation';
import { Theme } from '@/types/theme';
import { prisma } from '@/lib/prisma';
import { parsePresentation } from '@/utils/json';
import PresentationViewer from '@/components/viewer/PresentationViewer/PresentationViewer';
import { ReadOnlyProvider } from '@/contexts/ReadOnlyContext';
import { ThemeStylesApplier, ViewerProvider } from '@/components/viewer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { shouldHideBranding } from '@/utils/subscriptions';
import { Slide } from '@/types';
import styles from './page.module.css';

export default async function AllSlidesPage(props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ pdf?: string; hideBranding?: string; hasActiveSubscription?: string }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { id } = params;
    const { pdf, hideBranding, hasActiveSubscription } = searchParams;

    const isPdfExport = pdf === 'true';

    const session = await getServerSession(authOptions);

    const presentation = await prisma.presentation.findUnique({
        where: { id },
        include: {
            user: true,
        },
    });

    if (!presentation) {
        notFound();
    }

    const parsedPresentation = parsePresentation(presentation);
    const slides = parsedPresentation.slides;

    const visibleSlides = slides.filter((slide: Slide) => !slide.hidden);

    if (!visibleSlides || visibleSlides.length === 0) {
        notFound();
    }

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

    let shouldHideBrandingFlag = false;
    if (isPdfExport) {
        if (hideBranding === 'true') {
            shouldHideBrandingFlag = true;
        } else if (session?.user?.id) {
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
            <ThemeStylesApplier theme={theme} backgroundSettings={presentation.backgroundSettings || undefined}>
                <ViewerProvider>
                    <div
                        className={`${styles.pageContainer} ${isPdfExport ? styles.pdfMode : ''}`}
                        data-pdf-export={isPdfExport ? 'true' : undefined}
                    >
                        <PresentationViewer
                            slides={slides}
                            theme={theme}
                            primaryAccentColor={theme.colors.primaryAccent}
                            isPdfExport={isPdfExport}
                            hideBranding={shouldHideBrandingFlag}
                            hasActiveSubscription={hasActiveSubscriptionFlag}
                            globalHeaderFooterConfig={presentation.headerFooterConfig}
                        />
                    </div>
                </ViewerProvider>
            </ThemeStylesApplier>
        </ReadOnlyProvider>
    );
}
