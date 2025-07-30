import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus, PurchaseStatus } from '@prisma/client';
import { createSubscription } from '@/utils/subscriptions';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
                status: SubscriptionStatus.failed,
            },
            include: { plan: true },
        });

        if (!subscription) {
            return NextResponse.json({ error: 'Failed subscription not found' }, { status: 404 });
        }

        // Check if there are any recent failed payments
        const recentFailedPayments = await prisma.subscriptionPayment.findMany({
            where: {
                subscriptionId: subscription.id,
                status: PurchaseStatus.failed,
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
        });

        if (recentFailedPayments.length === 0) {
            return NextResponse.json(
                {
                    error: 'No recent failed payments found for this subscription',
                },
                { status: 400 }
            );
        }

        // Create a new subscription to retry payment
        const result = await createSubscription(session.user.id, subscription.planId);

        if (result.success && result.paymentData) {
            return NextResponse.json({
                success: true,
                subscriptionId: result.subscriptionId,
                paymentData: result.paymentData,
                message: 'Попытка повторной оплаты создана',
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Failed to create retry payment',
                },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error retrying payment:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 }
        );
    }
}
