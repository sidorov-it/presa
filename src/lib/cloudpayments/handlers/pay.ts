import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseWebhookPayload, CloudPaymentsWebhookData } from '../parseWebhookPayload';
import { PurchaseStatus, TransactionType, SubscriptionStatus } from '@prisma/client';
import { addTokens } from '@/utils/tokens';
import { calculateSubscriptionEndDate } from '@/utils/subscriptions';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { webhookData, paymentData } = await parseWebhookPayload(request);
        const isSubscription = Boolean(webhookData.SubscriptionId) || Boolean(paymentData.subscriptionId);

        if (isSubscription) {
            await handleSubscriptionPayment(webhookData, paymentData);
        } else {
            await handleTokenPurchase(webhookData, paymentData);
        }

        return NextResponse.json({ code: 0 });
    } catch (error) {
        console.error('CloudPayments pay handler error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

async function handleTokenPurchase(webhookData: CloudPaymentsWebhookData, paymentData: Record<string, any>) {
    // Validate required fields to prevent Prisma errors
    if (!webhookData.InvoiceId || !webhookData.AccountId) {
        console.warn('Invalid webhook data: missing InvoiceId or AccountId');
        return;
    }

    const purchase = await prisma.tokenPurchase.findFirst({
        where: { id: webhookData.InvoiceId },
        include: { package: true },
    });
    if (!purchase) {
        console.warn(`Purchase not found for InvoiceId: ${webhookData.InvoiceId}`);
        return; // Don't throw error, just return gracefully
    }

    if (webhookData.Status === 'Completed') {
        // Check if purchase is already completed to prevent duplicate processing
        if (purchase.status === PurchaseStatus.completed) {
            console.log(`Purchase ${purchase.id} already completed, skipping duplicate processing`);
            return;
        }

        // Update purchase status first
        await prisma.tokenPurchase.update({
            where: { id: purchase.id },
            data: {
                status: PurchaseStatus.completed,
                completedAt: new Date(),
                metadata: {
                    ...(purchase.metadata as Record<string, any> | undefined),
                    cloudpaymentsStatus: webhookData.Status,
                    cloudpaymentsTransactionId: webhookData.TransactionId,
                    cloudpaymentsAmount: webhookData.Amount,
                    cloudpaymentsCurrency: webhookData.Currency,
                    cloudpaymentsDateTime: webhookData.DateTime,
                    cloudpaymentsTestMode: webhookData.TestMode === '1',
                    cloudpaymentsTxId: webhookData.TransactionId,
                    ...paymentData,
                },
            },
        });

        // Add tokens (this function has its own retry logic)
        await addTokens(
            purchase.userId,
            purchase.tokensAmount,
            TransactionType.purchase,
            `Покупка токенов: ${purchase.package.name}`,
            purchase.id,
            {
                paymentProvider: 'cloudpayments',
                paymentId: webhookData.TransactionId,
                packageName: purchase.package.name,
                tokensAmount: purchase.tokensAmount,
                cloudpaymentsData: paymentData,
            }
        );
    } else if (
        webhookData.Status === 'Failed' ||
        webhookData.Status === 'Cancelled' ||
        webhookData.Status === 'Declined'
    ) {
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
                    failureReason:
                        webhookData.Status === 'Declined' ? 'Payment declined via CloudPayments webhook' : undefined,
                    ...paymentData,
                },
            },
        });
    }
}

async function handleSubscriptionPayment(webhookData: CloudPaymentsWebhookData, paymentData: Record<string, any>) {
    if (!webhookData.SubscriptionId || !webhookData.AccountId) {
        console.warn('Invalid subscription webhook data');
        return;
    }

    const existing = await prisma.userSubscription.findFirst({
        where: {
            userId: webhookData.AccountId,
            id: paymentData.subscriptionId,
        },
        include: { plan: true },
    });

    if (!existing) {
        console.warn('Subscription not found for payment');
        return;
    }

    const endDate = calculateSubscriptionEndDate(new Date(), existing.plan.interval);

    if (existing.status === SubscriptionStatus.pending) {
        await prisma.userSubscription.update({
            where: { id: existing.id },
            data: {
                status: SubscriptionStatus.active,
                cloudpaymentsId: webhookData.SubscriptionId,
                startDate: new Date(),
                endDate,
            },
        });
    } else {
        await prisma.userSubscription.create({
            data: {
                userId: existing.userId,
                planId: existing.planId,
                status: SubscriptionStatus.active,
                startDate: new Date(),
                endDate,
                cloudpaymentsId: webhookData.SubscriptionId,
            },
        });
    }

    await prisma.subscriptionPayment.create({
        data: {
            subscriptionId: existing.id,
            amount: parseFloat(webhookData.Amount),
            currency: webhookData.Currency,
            status: PurchaseStatus.completed,
            cloudpaymentsId: webhookData.SubscriptionId,
            cloudpaymentsTransactionId: webhookData.TransactionId,
            billingStart: new Date(),
            billingEnd: endDate,
            completedAt: new Date(),
        },
    });
}
