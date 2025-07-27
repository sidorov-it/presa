import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseWebhookPayload, CloudPaymentsWebhookData } from '../parseWebhookPayload';
import { PurchaseStatus, SubscriptionStatus } from '@prisma/client';

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

async function handleSubscriptionPaymentFailure(webhookData: CloudPaymentsWebhookData, paymentData: Record<string, any>) {
    // Validate required fields
    if (!webhookData.SubscriptionId || !webhookData.AccountId) {
        console.warn('Invalid subscription failure webhook data: missing SubscriptionId or AccountId');
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
        console.warn(`Subscription not found for failure: ${webhookData.SubscriptionId}`);
        return;
    }

    // Create failed payment record
    await prisma.subscriptionPayment.create({
        data: {
            subscriptionId: subscription.id,
            amount: parseFloat(webhookData.Amount),
            currency: webhookData.Currency,
            status: PurchaseStatus.failed,
            cloudpaymentsId: webhookData.SubscriptionId,
            cloudpaymentsTransactionId: webhookData.TransactionId,
            billingStart: new Date(),
            billingEnd: new Date(),
            completedAt: new Date(),
            metadata: {
                cloudpaymentsStatus: webhookData.Status,
                cloudpaymentsDateTime: webhookData.DateTime,
                cloudpaymentsTestMode: webhookData.TestMode === '1',
                failureReason: 'Payment failed via CloudPayments webhook',
                ...paymentData,
            },
        },
    });

    // Update subscription status if it's pending
    if (subscription.status === SubscriptionStatus.pending) {
        await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: {
                status: SubscriptionStatus.failed,
                metadata: {
                    ...(subscription.metadata as Record<string, any> | undefined),
                    cloudpaymentsStatus: webhookData.Status,
                    cloudpaymentsDateTime: webhookData.DateTime,
                    cloudpaymentsTestMode: webhookData.TestMode === '1',
                    lastFailureDate: new Date().toISOString(),
                    failureReason: 'Payment failed via CloudPayments webhook',
                    ...paymentData,
                },
            },
        });
    }

    console.log(`Subscription payment failed for subscription ${subscription.id}`);
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

    console.log(`Token purchase failed for purchase ${purchase.id}`);
}
