import { Suspense } from 'react';
import ThemeEditorPageContent from './ThemeEditorPageContent';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(
    props: { params: { action: string } }
): Promise<Metadata> {
    const { action } = props.params;
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

export default function ThemeEditorPage(props: { params: Promise<{ action: string }> }) {
    return (
        <Suspense>
            <ThemeEditorPageContent params={props.params} />
        </Suspense>
    );
}
