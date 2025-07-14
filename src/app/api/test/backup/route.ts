import { withLogging } from '@/hooks/withLoging';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

async function GETHandler(request: NextRequest) {
    const allThemes = await prisma.theme.findMany({
        where: {
            isDefault: true,
        },
    });

    await prisma.presentation.updateMany({
        where: {
            isDeleted: false,
        },
        data: {
            themeId: allThemes[Math.floor(Math.random() * allThemes.length)].id,
        },
    });
}
export const GET = withLogging(GETHandler);
