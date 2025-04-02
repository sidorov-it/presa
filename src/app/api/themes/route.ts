import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const themes = await prisma.theme.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        return NextResponse.json(themes);
    } catch (error) {
        console.error('Failed to fetch themes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch themes' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { id: _id, ...theme } = await request.json();

        // Delete all existing themes
        await prisma.theme.deleteMany();

        // Insert all new themes
        const createdTheme = await prisma.theme.create({
            data: {
                ...theme,
                colors: {
                    set: theme.colors,
                },
                typography: {
                    set: theme.typography,
                },
                design: {
                    set: theme.design,
                },
                logo: null,
            },
        });

        return NextResponse.json({ success: true, theme: createdTheme });
    } catch (error) {
        console.error('Failed to save themes:', error);
        return NextResponse.json(
            { error: 'Failed to save themes' },
            { status: 500 }
        );
    }
}