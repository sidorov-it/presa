import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const isDefaultParam = url.searchParams.get('default');

        const where: any = { isActive: true };
        if (isDefaultParam !== null) {
            where.isDefault = isDefaultParam === 'true';
        } else {
            where.isDefault = false;
        }

        const themes = await prisma.theme.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
        });
        return NextResponse.json(themes);
    } catch (error) {
        console.error('Failed to fetch themes:', error);
        return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const theme = await request.json();

        // Create a new theme
        const createdTheme = await prisma.theme.create({
            data: {
                name: theme.name,
                colors: {
                    set: theme.colors,
                },
                typography: {
                    set: theme.typography,
                },
                design: {
                    set: theme.design,
                },
                isDefault: theme.isDefault ?? false,
                isActive: theme.isActive ?? true,
                logo: null,
            },
        });

        return NextResponse.json(createdTheme, { status: 201 });
    } catch (error) {
        console.error('Failed to create theme:', error);
        return NextResponse.json({ error: 'Failed to create theme' }, { status: 500 });
    }
}
