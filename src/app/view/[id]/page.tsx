import type { Metadata } from 'next';
import PresentationView from './page.client';
import { prisma } from '@/lib/prisma';

type Props = {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { id } = await props.params;
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
