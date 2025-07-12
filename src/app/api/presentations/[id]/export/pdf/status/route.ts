import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { PdfGenerationStatus } from '@prisma/client';

const handleRequest = async (request: NextRequest, props: { params: { id: string } }) => {
    try {
        const params = await props.params;
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const presentationId = params.id;

        // Get taskId from query parameters
        const { searchParams } = new URL(request.url);
        const taskId = searchParams.get('taskId');

        if (!taskId) {
            return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
        }

        // Fetch task from database
        const task = await prisma.pdfGenerationTask.findUnique({
            where: { id: taskId },
            include: {
                user: true,
                presentation: true,
            },
        });

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Check if user owns the task
        if (task.user.email !== session.user.email) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if task is for the correct presentation
        if (task.presentationId !== presentationId) {
            return NextResponse.json({ error: 'Task does not belong to this presentation' }, { status: 400 });
        }

        // Calculate progress percentage
        const progressPercentage =
            task.totalSlides > 0 ? Math.round((task.completedSlides / task.totalSlides) * 100) : 0;

        // Return status based on task state
        switch (task.status) {
            case PdfGenerationStatus.pending:
                return NextResponse.json({
                    status: 'pending',
                    message: 'PDF generation is queued',
                    progress: 0,
                    totalSlides: task.totalSlides,
                    completedSlides: task.completedSlides,
                });

            case PdfGenerationStatus.in_progress:
                return NextResponse.json({
                    status: 'in_progress',
                    // message: `Generating PDF... ${task.completedSlides}/${task.totalSlides} slides completed`,
                    progress: progressPercentage,
                    totalSlides: task.totalSlides,
                    completedSlides: task.completedSlides,
                });

            case PdfGenerationStatus.completed:
                if (!task.filePath) {
                    return NextResponse.json({ error: 'PDF file not found' }, { status: 500 });
                }

                return NextResponse.json({
                    status: 'completed',
                    message: 'PDF generation completed successfully',
                    progress: 100,
                    totalSlides: task.totalSlides,
                    completedSlides: task.completedSlides,
                    downloadUrl: task.filePath,
                    fileName: task.fileName,
                    fileSize: task.fileSize,
                    completedAt: task.completedAt,
                });

            case PdfGenerationStatus.failed:
                return NextResponse.json({
                    status: 'failed',
                    message: 'PDF generation failed',
                    error: task.errorMessage || 'Unknown error occurred',
                    progress: progressPercentage,
                    totalSlides: task.totalSlides,
                    completedSlides: task.completedSlides,
                });

            default:
                return NextResponse.json({ error: 'Unknown task status' }, { status: 500 });
        }
    } catch (error) {
        logger.error('PDF status check error:', error);
        return NextResponse.json({ error: 'Failed to check PDF status' }, { status: 500 });
    }
};

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    return handleRequest(request, { params });
}
