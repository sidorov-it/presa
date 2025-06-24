import { NextRequest, NextResponse } from 'next/server';
import { convertBasicThemeToFull } from '@/utils/themeConverter';
import themes from './themes.json';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const themesData = themes.map((theme: any) => {
        return convertBasicThemeToFull(
            theme,
            theme.name
        );
    });

    await prisma.theme.createMany({
        data: themesData,
    });

    return NextResponse.json(themesData);
}
