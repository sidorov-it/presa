import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { parsePresentations } from '@/utils/json';

// Get deleted presentations
export async function GET() {
    try {
        const presentations = await prisma.presentation.findMany({
            where: { isDeleted: true },
            orderBy: { updatedAt: 'desc' },
        });

        // Use the utility function to parse the slides JSON in all presentations
        return NextResponse.json(parsePresentations(presentations));
    } catch (error) {
        logger.error('Error fetching deleted presentations:', error);
        return NextResponse.json({ error: 'Error fetching deleted presentations' }, { status: 500 });
    }
}

// Restore a presentation
export async function PUT(request: NextRequest) {
    try {
        const { id } = await request.json();

        const presentation = await prisma.presentation.update({
            where: { id },
            data: { isDeleted: false },
        });

        if (!presentation) {
            return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Presentation restored successfully',
        });
    } catch (error) {
        logger.error('Error restoring presentation:', error);
        return NextResponse.json({ error: 'Error restoring presentation' }, { status: 500 });
    }
}

// Permanently delete a presentation
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'Неверный идентификатор презентации' }, { status: 400 });
        }

        const userId = session.user.id;

        // Find and permanently delete the presentation
        const result = await prisma.presentation.delete({
            where: {
                id: id,
                userId: userId,
                isDeleted: true,
            },
        });

        if (!result) {
            return NextResponse.json({ message: 'Presentation not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Presentation permanently deleted',
        });
    } catch (error) {
        logger.error('Permanent delete presentation error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
