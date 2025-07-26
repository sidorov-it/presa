import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: subscriptionId } = await params;

        // Find the subscription and verify ownership
        const subscription = await prisma.userSubscription.findFirst({
            where: {
                id: subscriptionId,
                userId: session.user.id,
                status: SubscriptionStatus.active,
            },
        });

        if (!subscription) {
            return NextResponse.json(
                { error: 'Subscription not found or cannot be cancelled' },
                { status: 404 }
            );
        }

        // Update subscription status to cancelled
        const updatedSubscription = await prisma.userSubscription.update({
            where: { id: subscriptionId },
            data: {
                status: SubscriptionStatus.cancelled,
                cancelledAt: new Date(),
                cancelReason: 'User requested cancellation',
                // Keep the endDate as is - user can use subscription until it expires
            },
        });

        // Log the cancellation
        console.log(`Subscription ${subscriptionId} cancelled by user ${session.user.id}`);

        return NextResponse.json({
            success: true,
            message: 'Subscription cancelled successfully',
            subscription: updatedSubscription,
        });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        return NextResponse.json(
            {
                error: 'Failed to cancel subscription',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
} 