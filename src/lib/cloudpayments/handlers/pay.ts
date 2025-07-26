import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseWebhookPayload, CloudPaymentsWebhookData } from '../parseWebhookPayload';
import { PurchaseStatus, TransactionType, SubscriptionStatus } from '@prisma/client';
import { addTokens } from '@/utils/tokens';
import {
    activateSubscription,
    calculateNextBillingDate,
    performSubscriptionHealthCheck,
    extendSubscription,
} from '@/utils/subscriptions';

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
    // Validate required fields to prevent Prisma errors
    if (!webhookData.SubscriptionId || !webhookData.AccountId) {
        console.warn('Invalid subscription webhook data: missing SubscriptionId or AccountId');
        return;
    }

    let subscription = await prisma.userSubscription.findFirst({
        where: {
            userId: webhookData.AccountId,
            cloudpaymentsId: webhookData.SubscriptionId,
        },
        include: { plan: true },
    });

    if (!subscription) {
        subscription = await prisma.userSubscription.findFirst({
            where: {
                id: paymentData.subscriptionId,
                userId: webhookData.AccountId,
            },
            include: { plan: true },
        });
    }

    if (!subscription) {
        throw new Error('Subscription not found');
    }

    if (!subscription.cloudpaymentsId && webhookData.SubscriptionId) {
        await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: { cloudpaymentsId: webhookData.SubscriptionId },
        });
    }

    const dataForDb = {
        amount: parseFloat(webhookData.Amount),
        currency: webhookData.Currency,
        cloudpaymentsId: webhookData.SubscriptionId,
        cloudpaymentsTransactionId: webhookData.TransactionId,
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
        // Проверяем, не был ли уже обработан этот платеж
        const existingPayment = await prisma.subscriptionPayment.findFirst({
            where: {
                cloudpaymentsTransactionId: webhookData.TransactionId,
                status: PurchaseStatus.completed,
            },
        });

        if (existingPayment) {
            console.log(`Payment ${webhookData.TransactionId} already processed, skipping duplicate`);
            return;
        }

        // Определяем, является ли это продлением существующей активной подписки
        const isRenewal = subscription.cloudpaymentsId !== null && subscription.status === SubscriptionStatus.active;
        
        console.log(
            `Processing subscription payment: ${isRenewal ? 'RENEWAL' : 'NEW'} for subscription ${subscription.id}, user ${webhookData.AccountId}`
        );
        
        // Рассчитываем даты биллинга
        let billingStart: Date;
        let billingEnd: Date;
        
        if (isRenewal) {
            // Для продления: новый период начинается с даты окончания текущей подписки
            billingStart = subscription.endDate;
            billingEnd = calculateNextBillingDate(billingStart, subscription.plan.interval);
        } else {
            // Для новой подписки: период начинается с текущей даты
            billingStart = new Date();
            billingEnd = calculateNextBillingDate(billingStart, subscription.plan.interval);
        }

        // Retry logic for transaction conflicts
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                let payment;
                
                if (isRenewal) {
                    // Для продления: создаем новую запись платежа
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
                    console.log(
                        `Created renewal payment record ${payment.id} for subscription ${subscription.id}, billing period: ${billingStart.toISOString()} - ${billingEnd.toISOString()}`
                    );
                } else {
                    // Для новой подписки: ищем существующую запись со статусом pending и обновляем её
                    const pendingPayment = await prisma.subscriptionPayment.findFirst({
                        where: {
                            subscriptionId: subscription.id,
                            status: 'pending',
                        },
                    });

                    if (pendingPayment) {
                        payment = await prisma.subscriptionPayment.update({
                            where: { id: pendingPayment.id },
                            data: {
                                billingStart,
                                billingEnd,
                                status: PurchaseStatus.completed,
                                completedAt: new Date(),
                                cloudpaymentsTransactionId: webhookData.TransactionId,
                                ...dataForDb,
                            },
                        });
                        console.log(
                            `Updated pending payment record ${payment.id} for subscription ${subscription.id}, billing period: ${billingStart.toISOString()} - ${billingEnd.toISOString()}`
                        );
                    } else {
                        // Если pending записи нет, создаем новую (fallback)
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
                        console.log(
                            `Created new payment record ${payment.id} for subscription ${subscription.id} (no pending found), billing period: ${billingStart.toISOString()} - ${billingEnd.toISOString()}`
                        );
                    }
                }

                let subscriptionUpdated = false;
                
                if (subscription.status === SubscriptionStatus.pending) {
                    // Активируем новую подписку
                    subscriptionUpdated = await activateSubscription(subscription.id, webhookData.SubscriptionId);
                } else {
                    // Продлеваем существующую подписку
                    subscriptionUpdated = await extendSubscription(subscription.id, payment.id);
                }

                // Update subscription metadata with payment information
                await prisma.userSubscription.update({
                    where: { id: subscription.id },
                    data: {
                        metadata: {
                            ...(subscription.metadata as Record<string, any> | undefined),
                            cloudpaymentsStatus: webhookData.Status,
                            cloudpaymentsTransactionId: webhookData.TransactionId,
                            cloudpaymentsTestMode: webhookData.TestMode === '1',
                            lastPaymentDate: new Date().toISOString(),
                            isRenewal,
                            ...paymentData,
                        },
                    },
                });

                if (subscriptionUpdated) {
                    // Perform health check with timeout to prevent hanging
                    try {
                        const healthCheckPromise = performSubscriptionHealthCheck(subscription.userId);
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Health check timeout')), 5000)
                        );
                        await Promise.race([healthCheckPromise, timeoutPromise]);
                    } catch (error) {
                        console.warn('Subscription health check failed or timed out:', error);
                        // Don't fail the webhook processing if health check fails
                    }
                }
                break; // Success, exit retry loop
            } catch (error: any) {
                retryCount++;
                if (error.code === 'P2034' && retryCount < maxRetries) {
                    // Transaction conflict, wait and retry
                    console.warn(
                        `Transaction conflict for subscription ${subscription.id}, retry ${retryCount}/${maxRetries}`
                    );
                    await new Promise(resolve => setTimeout(resolve, 100 * retryCount)); // Exponential backoff
                } else {
                    // Other error or max retries reached
                    throw error;
                }
            }
        }
    } else if (webhookData.Status === 'Failed' || webhookData.Status === 'Cancelled') {
        // Создаем запись о неудачном платеже
        await prisma.subscriptionPayment.create({
            data: {
                subscriptionId: subscription.id,
                billingStart: new Date(),
                billingEnd: new Date(),
                status: webhookData.Status === 'Failed' ? PurchaseStatus.failed : PurchaseStatus.canceled,
                completedAt: new Date(),
                ...dataForDb,
            },
        });

        if (subscription.status === SubscriptionStatus.pending) {
            await prisma.userSubscription.update({
                where: { id: subscription.id },
                data: { status: SubscriptionStatus.failed },
            });
        }
    }
}
