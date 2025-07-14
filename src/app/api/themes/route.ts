import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function GETHandler(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const onlyDefaultParam = url.searchParams.get('default');

        // If only default themes are requested
        if (onlyDefaultParam === 'true') {
            const defaultThemes = await prisma.theme.findMany({
                where: {
                    isDefault: true,
                    isActive: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            return NextResponse.json(defaultThemes);
        }

        // Get both user's themes and default themes
        const [userThemes, defaultThemes] = await Promise.all([
            prisma.theme.findMany({
                where: {
                    userId: session.user.id,
                    isActive: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.theme.findMany({
                where: {
                    isDefault: true,
                    isActive: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
        ]);

        // Combine and return both sets of themes
        return NextResponse.json([...userThemes, ...defaultThemes]);
    } catch (error) {
        logger.error('Failed to fetch themes:', error);
        return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 });
    }
}

async function POSTHandler(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const theme = await request.json();

        // Prevent regular users from creating default themes
        if (theme.isDefault && session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized to create default themes' }, { status: 403 });
        }

        // Create a new theme
        const createdTheme = await prisma.theme.create({
            data: {
                name: theme.name,
                colors: {
                    set: {
                        ...theme.colors,
                        secondaryAccents: theme.colors.secondaryAccents ?? [],
                    },
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
                userId: session.user.id, // Associate theme with user
            },
        });

        return NextResponse.json(createdTheme, { status: 201 });
    } catch (error) {
        logger.error('Failed to create theme:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json({ error: 'Failed to create theme' }, { status: 500 });
    }
}
export const GET = withLogging(GETHandler);
export const POST = withLogging(POSTHandler);
