import type { Metadata } from 'next';
import PresentationEditorPage from './page.client';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { isValidObjectId } from '@/utils/validateObjectId';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const { id } = await params;

    // Validate ObjectId format before querying database
    if (!isValidObjectId(id)) {
        return {
            title: 'Презентация не найдена',
            description: 'Запрашиваемая презентация не существует или была удалена',
        };
    }

    const session = await getServerSession(authOptions);

    const presentation = await prisma.presentation.findUnique({
        where: { id, userId: session?.user?.id },
        select: { title: true, isDeleted: true },
    });

    // Don't expose metadata for deleted presentations
    if (!presentation || presentation.isDeleted) {
        return {
            title: 'Презентация не найдена',
            description: 'Запрашиваемая презентация не существует или была удалена',
        };
    }

    return {
        title: presentation?.title || 'Редактор презентации',
        description: 'Страница редактирования выбранной презентации',
    };
}

export default function PresentationEditorWrapper() {
    return <PresentationEditorPage />;
}
