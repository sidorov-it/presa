import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const presentations = await prisma.presentation.findMany({
        where: {
            NOT: {
                themeId: null,
            },
        },
    });

    // const presentationsWithThemes = presentations.filter(p => p.themeId);

    const usedThemes = presentations.map(presentation => presentation.themeId).filter(Boolean);

    const themes = await prisma.theme.findMany({
        where: {
            id: { in: usedThemes },
            isDefault: true,
        },
    });

    const mapping = presentations.reduce((acc, presentation) => {
        const usedTheme = themes.find(t => t.id === presentation.themeId);

        if (usedTheme) {
            acc[presentation.id] = {
                presentationId: presentation.id,
                presentationName: presentation.title,
                themeId: usedTheme.id,
                themeName: usedTheme.name,
                newThemeId: usedTheme?.name,
            };
        }
        return acc;
    }, {});

    return NextResponse.json(mapping);
}
