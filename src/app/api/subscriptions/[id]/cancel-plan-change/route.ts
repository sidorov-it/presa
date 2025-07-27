import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';
import { cancelCloudPaymentsSubscription } from '@/utils/cloudpayments';

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
                status: SubscriptionStatus.active,
                nextPlanId: { not: null }, // Must have a scheduled plan change
            },
            include: { plan: true },
        });

        if (!subscription) {
            return NextResponse.json({ error: 'No scheduled plan change found' }, { status: 404 });
        }

        // Find the pending future subscription
        const futureSubscription = await prisma.userSubscription.findFirst({
            where: {
                userId: session.user.id,
                planId: subscription.nextPlanId!,
                status: SubscriptionStatus.pending,
            },
        });

        // Cancel the CloudPayments subscription if it exists
        if (futureSubscription?.cloudpaymentsId) {
            const cancelResult = await cancelCloudPaymentsSubscription(futureSubscription.cloudpaymentsId);
            if (!cancelResult.success) {
                console.warn('Failed to cancel CloudPayments subscription:', cancelResult.error);
            }
        }

        // Update current subscription to remove plan change
        await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: {
                nextPlanId: null,
                nextPlanStartDate: null,
            },
        });

        // Delete the future subscription if it exists
        if (futureSubscription) {
            await prisma.userSubscription.delete({
                where: { id: futureSubscription.id },
            });
        }

        console.log(`Plan change cancelled for subscription ${subscription.id} by user ${session.user.id}`);

        return NextResponse.json({
            success: true,
            message: 'Изменение плана отменено',
        });
    } catch (error) {
        console.error('Error cancelling plan change:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Internal server error' 
            }, 
            { status: 500 }
        );
    }
} 