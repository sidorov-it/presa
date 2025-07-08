import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const presentations = await prisma.presentation.findMany({
        where: {
            createdAt: {
                lte: new Date('2025-06-15'),
            },
        },
    });
    // const themes = await prisma.theme.findMany();

    // const themesIds = themes.map(t => t.id);

    // const presentationsWithoutThemes = presentations.filter(p => p.themeId && !themesIds.includes(p.themeId));

    await prisma.presentation.deleteMany({
        where: {
            createdAt: {
                lte: new Date('2025-06-15'),
            },
        },

    });

    return NextResponse.json(presentations);
}
