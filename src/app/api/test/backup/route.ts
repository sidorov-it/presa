import { withLogging } from '@/hooks/withLoging';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

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

    return NextResponse.json({ message: 'Backup completed' });
}
export const GET = withLogging(GETHandler);
