import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseWebhookPayload, CloudPaymentsWebhookData } from '../parseWebhookPayload';
import { SubscriptionStatus } from '@prisma/client';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { webhookData, paymentData } = await parseWebhookPayload(request);
        const isSubscription = Boolean(webhookData.SubscriptionId) || Boolean(paymentData.subscriptionId);

        if (isSubscription) {
            await handleSubscriptionCancellation(webhookData, paymentData);
        }

        return NextResponse.json({ code: 0 });
    } catch (error) {
        console.error('CloudPayments cancel handler error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

async function handleSubscriptionCancellation(webhookData: CloudPaymentsWebhookData, paymentData: Record<string, any>) {
    // Validate required fields
    if (!webhookData.SubscriptionId || !webhookData.AccountId) {
        console.warn('Invalid subscription cancellation webhook data: missing SubscriptionId or AccountId');
        return;
    }

    const subscription = await prisma.userSubscription.findFirst({
        where: {
            userId: webhookData.AccountId,
            cloudpaymentsId: webhookData.SubscriptionId,
        },
        include: { plan: true },
    });

    if (!subscription) {
        console.warn(`Subscription not found for cancellation: ${webhookData.SubscriptionId}`);
        return;
    }

    // Update subscription status to cancelled
    await prisma.userSubscription.update({
        where: { id: subscription.id },
        data: {
            status: SubscriptionStatus.cancelled,
            cancelledAt: new Date(),
            cancelReason: 'Cancelled via CloudPayments webhook',
            metadata: {
                ...(subscription.metadata as Record<string, any> | undefined),
                cloudpaymentsStatus: webhookData.Status,
                cloudpaymentsDateTime: webhookData.DateTime,
                cloudpaymentsTestMode: webhookData.TestMode === '1',
                cancellationSource: 'cloudpayments_webhook',
                ...paymentData,
            },
        },
    });

    console.log(`Subscription ${subscription.id} cancelled via CloudPayments webhook`);
}
