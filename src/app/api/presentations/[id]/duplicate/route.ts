import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { generateId } from '@/utils/id';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const presentationId = params.id;

        // Find the original presentation
        const originalPresentation = await prisma.presentation.findFirst({
            where: {
                id: presentationId,
                userId,
                isDeleted: false,
            },
        });

        if (!originalPresentation) {
            return NextResponse.json({ message: 'Presentation not found' }, { status: 404 });
        }

        // Create a deep copy of the slides data
        const slidesData = originalPresentation.slides as any;
        const newSlides = slidesData.map((slide: any) => {
            const newSlideId = generateId();
            const newLayouts = slide.layouts.map((layout: any) => {
                const newLayoutId = generateId();
                const newElements = layout.elements.map((element: any) => ({
                    ...element,
                    id: generateId(),
                }));
                return {
                    ...layout,
                    id: newLayoutId,
                    elements: newElements,
                };
            });
            return {
                ...slide,
                id: newSlideId,
                layouts: newLayouts,
            };
        });

        // Create the new presentation using Prisma
        const newPresentation = await prisma.presentation.create({
            data: {
                title: `${originalPresentation.title} (Копия)`,
                description: originalPresentation.description,
                slides: newSlides,
                userId: userId,
                isDeleted: false,
                themeId: originalPresentation.themeId,
            },
        });

        return NextResponse.json({
            message: 'Presentation duplicated successfully',
            presentation: newPresentation,
        });
    } catch (error) {
        logger.error('Duplicate presentation error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
