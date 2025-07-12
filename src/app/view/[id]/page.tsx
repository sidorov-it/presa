import type { Metadata } from 'next';
import PresentationView from './page.client';
import { prisma } from '@/lib/prisma';
import NotFoundPage from '@/components/NotFoundPage/NotFoundPage';
import { Theme } from '@/types/theme';
import { IPresentation } from '@/types';
import ServerThemeStylesApplier from '@/components/viewer/theme/ServerThemeStylesApplier';

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const presentation = await prisma.presentation.findUnique({
        where: { id },
        select: { title: true },
    });

    return {
        title: presentation?.title || 'Просмотр презентации',
        description: 'Демонстрационный режим выбранной презентации',
    };
}

// Server-side loading component
function PresentationLoader() {
    return (
        <>
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes presentation-loader-spin {
                        to {
                            transform: rotate(360deg);
                        }
                    }
                    .presentation-loader-spinner {
                        animation: presentation-loader-spin 1s linear infinite;
                    }
                `,
                }}
            />
            <div
                data-server-loader
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                }}
            >
                <div
                    className="presentation-loader-spinner"
                    style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '50%',
                        border: '2px solid #e2e8f0',
                        borderTop: '2px solid #3b82f6',
                    }}
                />
            </div>
        </>
    );
}

export default async function PresentationViewWrapper({ params }: Props) {
    const { id } = await params;
    const presentationData = await prisma.presentation.findUnique({
        where: { id },
    });

    if (!presentationData || !presentationData.themeId) {
        return <NotFoundPage />;
    }

    const theme = await prisma.theme.findUnique({
        where: { id: presentationData.themeId },
    });

    // Serialize the data to plain objects to avoid symbol properties
    const serializedPresentation = JSON.parse(JSON.stringify(presentationData));
    const serializedTheme = JSON.parse(JSON.stringify(theme));

    return (
        <>
            {/* Server-side loader - shown immediately */}
            <PresentationLoader />

            {/* Client-side presentation - will replace loader after hydration */}
            <ServerThemeStylesApplier theme={serializedTheme as Theme}>
                <PresentationView
                    presentation={serializedPresentation as IPresentation}
                    theme={serializedTheme as Theme}
                />
            </ServerThemeStylesApplier>
        </>
    );
}
