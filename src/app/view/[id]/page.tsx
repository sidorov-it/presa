import type { Metadata } from 'next';
import PresentationView from './page.client';
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
        title: presentation?.title || 'Просмотр презентации',
        description: 'Демонстрационный режим выбранной презентации',
    };
}

export default function PresentationViewWrapper() {
    return <PresentationView />;
}
