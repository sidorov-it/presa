import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generatePdfAsync } from '@/utils/pdfGeneration';
import { shouldHideBranding } from '@/utils/subscriptions';

const handleRequest = async (request: NextRequest, props: { params: { id: string } }) => {
    try {
        const params = await props.params;
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const presentationId = params.id;

        // Get slideIndex from query parameters
        const { searchParams } = new URL(request.url);
        const slideIndexParam = searchParams.get('slideIndex');
        const slideIndex = slideIndexParam ? parseInt(slideIndexParam, 10) : null;

        // Fetch presentation from database
        const presentation = await prisma.presentation.findUnique({
            where: { id: presentationId },
            include: { user: true },
        });

        if (!presentation) {
            return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
        }

        // Check if user owns the presentation
        if (presentation.user.email !== session.user.email) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse slides from JSON
        const slides = typeof presentation.slides === 'string' ? JSON.parse(presentation.slides) : presentation.slides;
        const visibleSlides = slides.filter((s: any) => !s.hidden);

        if (!visibleSlides || visibleSlides.length === 0) {
            return NextResponse.json({ error: 'No slides found' }, { status: 400 });
        }

        // Validate slideIndex if provided
        if (slideIndex !== null) {
            if (slideIndex < 0 || slideIndex >= slides.length) {
                return NextResponse.json(
                    { error: `Invalid slide index. Must be between 0 and ${slides.length - 1}` },
                    { status: 400 }
                );
            }
        }

        // Create PDF generation task in database
        const task = await prisma.pdfGenerationTask.create({
            data: {
                userId: session.user.id,
                presentationId: presentationId,
                slideIndex: slideIndex,
                totalSlides: slideIndex !== null ? 1 : visibleSlides.length,
            },
        });

        // Check if branding should be hidden for this user
        const hideBranding = await shouldHideBranding(session.user.id);

        // Get the base URL for the slide pages
        // const baseUrl = 'http://localhost:3000';
        const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://app.slydle.ru';

        // Start async PDF generation (don't await)
        generatePdfAsync(task.id, presentationId, slideIndex, baseUrl, hideBranding).catch(error => {
            logger.error('Async PDF generation failed:', error);
        });

        // Return task ID immediately
        return NextResponse.json(
            {
                taskId: task.id,
                message: 'PDF generation started',
                totalSlides: task.totalSlides,
            },
            { status: 202 }
        );
    } catch (error) {
        logger.error('PDF generation request error:', error instanceof Error ? error.message : error);
        return NextResponse.json({ error: 'Failed to start PDF generation' }, { status: 500 });
    }
};

async function GETHandler(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    return handleRequest(request, { params });
}

async function POSTHandler(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    return handleRequest(request, { params });
}
export const GET = withLogging(GETHandler);
export const POST = withLogging(POSTHandler);
