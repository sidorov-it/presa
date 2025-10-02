import { Suspense } from 'react';
import ThemeEditorPageContent from './ThemeEditorPageContent';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(props: { params: Promise<{ action: string }> }): Promise<Metadata> {
    const { action } = await props.params;
    if (action === 'new') {
        return {
            title: 'Новая тема',
            description: 'Создание и редактирование темы оформления',
        };
    }

    const theme = await prisma.theme.findUnique({
        where: { id: action },
        select: { name: true },
    });

    return {
        title: theme?.name || 'Редактор темы',
        description: 'Создание и редактирование темы оформления',
    };
}

export default async function ThemeEditorPage(props: { params: Promise<{ action: string }> }) {
    const params = await props.params;

    return (
        <Suspense>
            <ThemeEditorPageContent params={params} />
        </Suspense>
    );
}
