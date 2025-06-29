import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PresentationView from './page.client';
import { prisma } from '@/lib/prisma';
import createNewTheme from '@/utils/theme/createNewTheme';
import { Theme } from '@/types/theme';

export async function generateMetadata(
    props: { params: { id: string } }
): Promise<Metadata> {
    const { id } = props.params;
    const presentation = await prisma.presentation.findUnique({
        where: { id },
        select: { title: true },
    });

    return {
        title: presentation?.title || 'Просмотр презентации',
        description: 'Демонстрационный режим выбранной презентации',
    };
}

export default async function PresentationViewWrapper({
    params,
}: {
    params: { id: string };
}) {
    const { id } = params;
    const presentation = await prisma.presentation.findUnique({
        where: { id },
    });

    if (!presentation) {
        notFound();
    }

    let theme: Theme | null = null;
    if (presentation.themeId) {
        const dbTheme = await prisma.theme.findUnique({
            where: { id: presentation.themeId },
        });
        if (dbTheme) {
            theme = {
                ...dbTheme,
                description: dbTheme.description || undefined,
            } as Theme;
        }
    }

    const finalTheme: Theme = theme || { ...createNewTheme(), id: 'default-theme' };

    return <PresentationView presentation={presentation as any} theme={finalTheme} />;
}
