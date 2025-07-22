import type { Metadata } from 'next';
import PresentationEditorPage from './page.client';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const presentation = await prisma.presentation.findUnique({
        where: { id, userId: session?.user?.id },
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
