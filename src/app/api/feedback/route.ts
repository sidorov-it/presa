import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const body = await request.json();

        const { rating, comment, page, metadata } = body;

        // Validate required fields
        if (!rating || !page) {
            return NextResponse.json({ error: 'Rating and page are required' }, { status: 400 });
        }

        // Validate rating value
        if (!['positive', 'negative'].includes(rating)) {
            return NextResponse.json({ error: 'Rating must be either "positive" or "negative"' }, { status: 400 });
        }

        // Get user agent from headers
        const userAgent = request.headers.get('user-agent') || undefined;

        // Create feedback record
        const feedback = await prisma.feedback.create({
            data: {
                rating,
                comment: comment || null,
                page,
                userAgent,
                userId: session?.user?.id || null,
                metadata: metadata || null,
            },
        });

        return NextResponse.json(
            {
                success: true,
                feedbackId: feedback.id,
                message: 'Спасибо за ваш отзыв!',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error saving feedback:', error);
        return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }
}
