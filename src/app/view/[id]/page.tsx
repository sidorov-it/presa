import type { Metadata } from 'next';
import PresentationView from './page.client';
import { prisma } from '@/lib/prisma';
import NotFoundPage from '@/components/NotFoundPage/NotFoundPage';
import { Theme } from '@/types/theme';
import { IPresentation } from '@/types';

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

    return <PresentationView presentation={serializedPresentation as IPresentation} theme={serializedTheme as Theme} />;
}
