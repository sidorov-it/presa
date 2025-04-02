import { NextResponse } from 'next/server';
import { Theme } from '@/types/theme';
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
        const themes = await request.json();
        
        // Delete all existing themes
        await prisma.theme.deleteMany();
        
        // Insert all new themes
        const createdThemes = await prisma.theme.createMany({
            data: themes.map((theme: Theme) => ({
                id: theme.id,
                name: theme.name,
                description: theme.description,
                logo: theme.logo,
                colors: theme.colors,
                typography: theme.typography,
                design: theme.design,
                createdAt: theme.createdAt,
                updatedAt: theme.updatedAt,
            })),
        });

        return NextResponse.json({ success: true, count: createdThemes.count });
    } catch (error) {
        console.error('Failed to save themes:', error);
        return NextResponse.json(
            { error: 'Failed to save themes' },
            { status: 500 }
        );
    }
}