import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
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
