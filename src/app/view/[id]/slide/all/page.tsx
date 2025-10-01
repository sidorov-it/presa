import { notFound } from 'next/navigation';
import { Theme } from '@/types/theme';
import { prisma } from '@/lib/prisma';
import { parsePresentation } from '@/utils/json';
import { Slide } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { shouldHideBranding } from '@/utils/subscriptions';
import { ReadOnlyProvider } from '@/contexts/ReadOnlyContext';
import { PresentationViewer, ThemeStylesApplier, ViewerProvider } from '@/components/viewer';
import styles from './page.module.css';

interface PageSearchParams {
    pdf?: string;
    hideBranding?: string;
    hasActiveSubscription?: string;
}

export default async function AllSlidesPage(props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<PageSearchParams>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { id } = params;
    const { pdf, hideBranding, hasActiveSubscription } = searchParams;

    const isPdfExport = pdf === 'true';

    const session = await getServerSession(authOptions);

    const presentation = await prisma.presentation.findUnique({
        where: { id },
        include: { user: true },
    });

    if (!presentation) {
        notFound();
    }

    const parsedPresentation = parsePresentation(presentation);
    const slides = parsedPresentation.slides as Slide[];

    const visibleSlides = slides.filter(slide => !slide.hidden);

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

    const containerClassName = `${styles.pageContainer} ${isPdfExport ? styles.pageContainerPdf : ''}`;

    return (
        <ReadOnlyProvider isReadOnly={true}>
            <ThemeStylesApplier theme={theme} backgroundSettings={presentation.backgroundSettings || undefined}>
                <ViewerProvider>
                    <div className={containerClassName}>
                        <div className={styles.viewerWrapper}>
                            <PresentationViewer
                                slides={slides}
                                primaryAccentColor={theme.colors.primaryAccent}
                                theme={theme}
                                globalHeaderFooterConfig={presentation.headerFooterConfig}
                                hasActiveSubscription={hasActiveSubscriptionFlag}
                                isPdfExport={isPdfExport}
                                hideBranding={shouldHideBrandingFlag}
                            />
                        </div>
                    </div>
                </ViewerProvider>
            </ThemeStylesApplier>
        </ReadOnlyProvider>
    );
}
