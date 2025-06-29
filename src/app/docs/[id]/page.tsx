import type { Metadata } from 'next';
import PresentationEditorPage from './page.client';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(
    props: { params: { id: string } }
): Promise<Metadata> {
    const { id } = props.params;
    const presentation = await prisma.presentation.findUnique({
        where: { id },
        select: { title: true },
    });

    return {
        title: presentation?.title || 'Редактор презентации',
        description: 'Страница редактирования выбранной презентации',
    };
}

export default function PresentationEditorWrapper() {
    return <PresentationEditorPage />;
}
