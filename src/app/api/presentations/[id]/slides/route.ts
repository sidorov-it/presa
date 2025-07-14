import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Slide } from '@/types';

async function PUTHandler(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { slides } = await req.json();

        if (!Array.isArray(slides)) {
            return NextResponse.json({ message: 'Slides must be an array' }, { status: 400 });
        }

        // Validate that each slide has the required structure
        const validSlides = slides.every((slide: Slide) => {
            return (
                slide.id &&
                Array.isArray(slide.layouts) &&
                slide.layouts.every(layout => {
                    return (
                        layout.id &&
                        layout.type &&
                        Array.isArray(layout.elements) &&
                        layout.elements.every(element => {
                            return element.id && element.elementTypeId && element.cellId;
                        })
                    );
                })
            );
        });

        if (!validSlides) {
            return NextResponse.json({ message: 'Неверная структура слайда' }, { status: 400 });
        }

        // Update presentation with new slides
        const presentation = await prisma.presentation.update({
            where: {
                id: params.id,
                userId: session.user.id,
            },
            data: {
                slides: slides,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({ presentation });
    } catch (error) {
        logger.error('Error updating slides:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export const PUT = withLogging(PUTHandler);
