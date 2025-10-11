import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseWebhookPayload, CloudPaymentsWebhookData } from '../parseWebhookPayload';
import { PurchaseStatus } from '@prisma/client';
import logger from '@/utils/logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { webhookData, paymentData } = await parseWebhookPayload(request);
        const isSubscription = Boolean(webhookData.SubscriptionId) || Boolean(paymentData.subscriptionId);

        if (isSubscription) {
            await handleSubscriptionPaymentFailure(webhookData, paymentData);
        } else {
            await handleTokenPurchaseFailure(webhookData, paymentData);
        }

        return NextResponse.json({ code: 0 });
    } catch (error) {
        console.error('CloudPayments fail handler error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

async function handleSubscriptionPaymentFailure(webhookData: CloudPaymentsWebhookData) {
    // Validate required fields
    if (!webhookData.SubscriptionId || !webhookData.AccountId) {
        console.warn('Invalid subscription failure webhook data: missing SubscriptionId or AccountId');
        return;
    }

    logger.info(
        `Subscription payment failed for subscription. UserId: ${webhookData.AccountId}, SubscriptionId: ${webhookData.SubscriptionId}`
    );
    
}

async function handleTokenPurchaseFailure(webhookData: CloudPaymentsWebhookData, paymentData: Record<string, any>) {
    // Validate required fields
    if (!webhookData.InvoiceId || !webhookData.AccountId) {
        console.warn('Invalid token purchase failure webhook data: missing InvoiceId or AccountId');
        return;
    }

    const purchase = await prisma.tokenPurchase.findFirst({
        where: { id: webhookData.InvoiceId },
        include: { package: true },
    });

    if (!purchase) {
        console.warn(`Token purchase not found for failure: ${webhookData.InvoiceId}`);
        return;
    }

    // Update purchase status to failed
    await prisma.tokenPurchase.update({
        where: { id: purchase.id },
        data: {
            status: PurchaseStatus.failed,
            metadata: {
                ...(purchase.metadata as Record<string, any> | undefined),
                cloudpaymentsStatus: webhookData.Status,
                cloudpaymentsTransactionId: webhookData.TransactionId,
                cloudpaymentsDateTime: webhookData.DateTime,
                cloudpaymentsTestMode: webhookData.TestMode === '1',
                failureReason: 'Payment failed via CloudPayments webhook',
                ...paymentData,
            },
        },
    });


}
