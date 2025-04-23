import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Theme } from '@/types/theme';

interface Params {
    id: string;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const themeData = await prisma.theme.findUnique({
            where: { id: params.id },
        });

        if (!themeData) {
            return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
        }

        // Convert to proper Theme type with correct structure
        const theme: Theme = {
            id: themeData.id,
            name: themeData.name,
            description: themeData.description || undefined,
            logo: themeData.logo || undefined,
            colors: themeData.colors,
            typography: {
                ...themeData.typography,
                // Ensure numbers are parsed correctly
                headingWeight: Number(themeData.typography.headingWeight),
                bodyWeight: Number(themeData.typography.bodyWeight),
            },
            design: {
                slide: themeData.design.slide,
                blocks: {
                    ...themeData.design.blocks,
                },
                buttons: themeData.design.buttons,
            },
            createdAt: themeData.createdAt,
            updatedAt: themeData.updatedAt,
        };

        return NextResponse.json(theme, { status: 200 });
    } catch (error) {
        console.error('Error fetching theme:', error);
        return NextResponse.json({ error: 'Failed to fetch theme' }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<Params> }) {
    const params = await props.params;
    try {
        const { id } = params;

        const theme = await prisma.theme.findUnique({
            where: { id },
        });

        if (!theme) {
            return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
        }

        await prisma.theme.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete theme:', error);
        return NextResponse.json({ error: 'Failed to delete theme' }, { status: 500 });
    }
}

export async function PUT(request: Request, props: { params: Promise<Params> }) {
    const params = await props.params;
    try {
        const { id } = params;
        const theme = await request.json();

        // Verify the theme exists
        const existingTheme = await prisma.theme.findUnique({
            where: { id },
        });

        if (!existingTheme) {
            return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
        }

        // Update the theme
        const updatedTheme = await prisma.theme.update({
            where: { id },
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
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(updatedTheme);
    } catch (error) {
        console.error('Failed to update theme:', error);
        return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
    }
}
