import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseWebhookPayload, CloudPaymentsWebhookData } from '../parseWebhookPayload';
import { PurchaseStatus, TransactionType, SubscriptionStatus } from '@prisma/client';
import { addTokens } from '@/utils/tokens';
import {
    activateSubscription,
    calculateNextBillingDate,
    performSubscriptionHealthCheck,
} from '@/utils/subscriptions';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { webhookData, paymentData } = await parseWebhookPayload(request);
        const isSubscription =
            Boolean(webhookData.SubscriptionId) || Boolean(paymentData.subscriptionId);

        if (isSubscription) {
            await handleSubscriptionPayment(webhookData, paymentData);
        } else {
            await handleTokenPurchase(webhookData, paymentData);
        }

        return NextResponse.json({ code: 0 });
    } catch (error) {
        console.error('CloudPayments pay handler error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 },
        );
    }
}

async function handleTokenPurchase(
    webhookData: CloudPaymentsWebhookData,
    paymentData: Record<string, any>,
) {
    const purchase = await prisma.tokenPurchase.findFirst({
        where: { id: webhookData.InvoiceId },
        include: { package: true },
    });
    if (!purchase) {
        throw new Error('Purchase not found');
    }

    if (webhookData.Status === 'Completed') {
        await prisma.$transaction(async (tx) => {
            await tx.tokenPurchase.update({
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
                },
            );
        });
    } else if (webhookData.Status === 'Failed' || webhookData.Status === 'Cancelled') {
        await prisma.tokenPurchase.update({
            where: { id: purchase.id },
            data: {
                status:
                    webhookData.Status === 'Failed'
                        ? PurchaseStatus.failed
                        : PurchaseStatus.canceled,
                metadata: {
                    ...(purchase.metadata as Record<string, any> | undefined),
                    cloudpaymentsStatus: webhookData.Status,
                    cloudpaymentsTransactionId: webhookData.TransactionId,
                    cloudpaymentsDateTime: webhookData.DateTime,
                    cloudpaymentsTestMode: webhookData.TestMode === '1',
                    ...paymentData,
                },
            },
        });
    }
}

async function handleSubscriptionPayment(
    webhookData: CloudPaymentsWebhookData,
    paymentData: Record<string, any>,
) {
    const subscription = await prisma.userSubscription.findFirst({
        where: {
            OR: [
                { cloudpaymentsId: webhookData.SubscriptionId },
                { id: paymentData.subscriptionId },
                { id: webhookData.InvoiceId },
            ],
        },
        include: { plan: true },
    });

    if (!subscription) {
        throw new Error('Subscription not found');
    }

    if (!subscription.cloudpaymentsId && webhookData.SubscriptionId) {
        await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: { cloudpaymentsId: webhookData.SubscriptionId },
        });
    }

    let payment = await prisma.subscriptionPayment.findFirst({
        where: { subscriptionId: subscription.id, cloudpaymentsId: webhookData.TransactionId },
    });

    const dataForDb = {
        amount: parseFloat(webhookData.Amount),
        currency: webhookData.Currency,
        cloudpaymentsId: webhookData.TransactionId,
        metadata: {
            cloudpaymentsStatus: webhookData.Status,
            cloudpaymentsDateTime: webhookData.DateTime,
            cloudpaymentsTestMode: webhookData.TestMode === '1',
            subscriptionId: webhookData.SubscriptionId,
            recurrenceType: webhookData.RecurrenceType,
            ...paymentData,
        },
    };

    if (webhookData.Status === 'Completed') {
        if (!payment) {
            const billingStart = new Date();
            const billingEnd = calculateNextBillingDate(billingStart, subscription.plan.interval);
            payment = await prisma.subscriptionPayment.create({
                data: {
                    subscriptionId: subscription.id,
                    billingStart,
                    billingEnd,
                    status: PurchaseStatus.completed,
                    completedAt: new Date(),
                    ...dataForDb,
                },
            });
        } else {
            payment = await prisma.subscriptionPayment.update({
                where: { id: payment.id },
                data: { status: PurchaseStatus.completed, completedAt: new Date(), ...dataForDb },
            });
        }

        let subscriptionUpdated = false;
        if (subscription.status === SubscriptionStatus.pending) {
            subscriptionUpdated = await activateSubscription(subscription.id, webhookData.TransactionId);
        } else if (subscription.status === SubscriptionStatus.active) {
            const newEnd = calculateNextBillingDate(subscription.endDate, subscription.plan.interval);
            const nextBilling = calculateNextBillingDate(newEnd, subscription.plan.interval);
            await prisma.userSubscription.update({
                where: { id: subscription.id },
                data: { endDate: newEnd, nextBillingDate: nextBilling, lastPaymentId: payment.id },
            });
            subscriptionUpdated = true;
        }
        if (subscriptionUpdated) {
            await performSubscriptionHealthCheck(subscription.userId);
        }
    } else if (webhookData.Status === 'Failed' || webhookData.Status === 'Cancelled') {
        if (payment) {
            await prisma.subscriptionPayment.update({
                where: { id: payment.id },
                data: {
                    status:
                        webhookData.Status === 'Failed'
                            ? PurchaseStatus.failed
                            : PurchaseStatus.canceled,
                    ...dataForDb,
                },
            });
        }
        if (subscription.status === SubscriptionStatus.pending) {
            await prisma.userSubscription.update({
                where: { id: subscription.id },
                data: { status: SubscriptionStatus.failed },
            });
        }
    }
}
