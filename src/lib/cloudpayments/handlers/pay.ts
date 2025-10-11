import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseWebhookPayload, CloudPaymentsWebhookData } from '../parseWebhookPayload';
import { PurchaseStatus, TransactionType, SubscriptionStatus } from '@prisma/client';
import { addTokens } from '@/utils/tokens';
import {
    // activateSubscription,
    calculateNextBillingDate,
    // performSubscriptionHealthCheck,
    // extendSubscription,
    calculateSubscriptionEndDate,
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
    const { subscriptionId: userSubscriptionId, planId, userId } = paymentData;
    const { OperationType, InvoiceId, SubscriptionId } = webhookData;

    if (OperationType !== 'Payment') {
        throw new Error('Operation type is not Payment');
    }

    // первая покупка
    if (userSubscriptionId) {
        const invoice = await prisma.subscriptionPayment.findFirst({
            where: {
                id: InvoiceId,
                userSubscriptionId,
                subscriptionPlanId: planId,
                // userId: userId,
                status: 'pending',
            },
        });

        if (!invoice) {
            throw new Error('Invoice not found or not pending');
        }

        const userSubscription = await prisma.userSubscription.findUnique({
            where: {
                id: invoice.userSubscriptionId,
            },
        });

        const subscriptionPlan = await prisma.subscriptionPlan.findUnique({
            where: {
                id: invoice.subscriptionPlanId,
            },
        });

        if (!userSubscription || !subscriptionPlan) {
            throw new Error('User subscription not found');
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const result = await prisma.$transaction(
            async (tx: typeof prisma) => {
                await tx.subscriptionPayment.update({
                    where: { id: InvoiceId },
                    data: {
                        status: 'completed',
                        completedAt: new Date(),
                        cloudpaymentsSubscriptionId: webhookData.SubscriptionId,
                        cloudpaymentsTransactionId: webhookData.TransactionId,
                    },
                });

                await tx.userSubscription.update({
                    where: { id: userSubscription.id },
                    data: {
                        status: SubscriptionStatus.active,
                        startDate: new Date(),
                        endDate: calculateSubscriptionEndDate(new Date(), subscriptionPlan.interval),
                        nextBillingDate: calculateNextBillingDate(new Date(), subscriptionPlan.interval),
                        cloudpaymentsSubscriptionId: webhookData.SubscriptionId,
                        cloudpaymentsTransactionId: webhookData.TransactionId,
                    },
                });

                return {
                    subscriptionPayment: tx.subscriptionPayment.findUnique({
                        where: { id: InvoiceId },
                    }),
                    userSubscription: tx.userSubscription.findUnique({
                        where: { id: userSubscriptionId },
                    }),
                };
            },
            {
                timeout: process.env.NODE_ENV === 'development' ? 60000 : undefined,
            }
        );


    } else {
        // обработка продления подписки
        // находим подписку по cloudpaymentsId и userId
        const userSubscription = await prisma.userSubscription.findFirst({
            where: {
                userId,
                cloudpaymentsSubscriptionId: SubscriptionId,
            },
        });

        if (!userSubscription) {
            throw new Error('User subscription not found');
        }

        const subscriptionPlan = await prisma.subscriptionPlan.findUnique({
            where: { id: userSubscription.subscriptionPlanId },
        });

        if (!subscriptionPlan) {
            throw new Error('Subscription plan not found');
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const result = await prisma.$transaction(
            async (tx: typeof prisma) => {
                const newSubscription = await tx.userSubscription.create({
                    data: {
                        userId: userSubscription.userId,
                        subscriptionPlanId: subscriptionPlan.id,
                        status: SubscriptionStatus.active,
                        startDate: new Date(),
                        endDate: calculateSubscriptionEndDate(new Date(), subscriptionPlan.interval),
                        nextBillingDate: calculateNextBillingDate(new Date(), subscriptionPlan.interval),
                        cloudpaymentsSubscriptionId: SubscriptionId,
                        cloudpaymentsTransactionId: webhookData.TransactionId,
                        metadata: {
                            ...(userSubscription.metadata as Record<string, any> | undefined),
                            cloudpaymentsStatus: webhookData.Status,
                            cloudpaymentsTransactionId: webhookData.TransactionId,
                            cloudpaymentsDateTime: webhookData.DateTime,
                            cloudpaymentsTestMode: webhookData.TestMode === '1',
                        },
                    },
                });

                const newPayment = await tx.subscriptionPayment.create({
                    data: {
                        userSubscriptionId: newSubscription.id,
                        subscriptionPlanId: subscriptionPlan.id,
                        amount: Number(webhookData.Amount),
                        currency: webhookData.Currency,
                        status: PurchaseStatus.completed,
                        completedAt: new Date(),
                        billingStart: new Date(),
                        billingEnd: calculateNextBillingDate(new Date(), subscriptionPlan.interval),
                        cloudpaymentsSubscriptionId: webhookData.SubscriptionId,
                        cloudpaymentsTransactionId: webhookData.TransactionId,
                        metadata: {
                            ...(userSubscription.metadata as Record<string, any> | undefined),
                            cloudpaymentsStatus: webhookData.Status,
                            cloudpaymentsDateTime: webhookData.DateTime,
                            cloudpaymentsTestMode: webhookData.TestMode === '1',
                        },
                    },
                });

                return {
                    subscriptionPayment: newPayment,
                    userSubscription: newSubscription,
                };
            },
            {
                timeout: process.env.NODE_ENV === 'development' ? 60000 : undefined,
            }
        );


    }

    // Validate required fields to prevent Prisma errors
    // if (!webhookData.SubscriptionId || !webhookData.AccountId) {
    //     console.warn('Invalid subscription webhook data: missing SubscriptionId or AccountId');
    //     return;
    // }

    // // ищем подписку по cloudpaymentsId
    // let subscription = await prisma.userSubscription.findFirst({
    //     where: {
    //         userId: webhookData.AccountId,
    //         cloudpaymentsId: webhookData.SubscriptionId,
    //     },
    //     include: { plan: true },
    // });

    // // FIXME: не нашли по cloudpaymentsId. Тогда должны найти pending?
    // if (!subscription) {
    //     subscription = await prisma.userSubscription.findFirst({
    //         where: {
    //             id: paymentData.subscriptionId,
    //             userId: webhookData.AccountId,
    //         },
    //         include: { plan: true },
    //     });
    // }

    // if (!subscription) {
    //     throw new Error('Subscription not found');
    // }

    // // подписка есть, но без cloudpaymentsId. Тогда сохраняем cloudpaymentsId. Оплата новой подписки
    // if (!subscription.cloudpaymentsId && webhookData.SubscriptionId) {
    //     await prisma.userSubscription.update({
    //         where: { id: subscription.id },
    //         data: { cloudpaymentsId: webhookData.SubscriptionId },
    //     });
    // }

    // // сохраняем данные для базы данных
    // const dataForDb = {
    //     amount: parseFloat(webhookData.Amount),
    //     currency: webhookData.Currency,
    //     cloudpaymentsId: webhookData.SubscriptionId,
    //     cloudpaymentsTransactionId: webhookData.TransactionId,
    //     metadata: {
    //         cloudpaymentsStatus: webhookData.Status,
    //         cloudpaymentsDateTime: webhookData.DateTime,
    //         cloudpaymentsTestMode: webhookData.TestMode === '1',
    //         subscriptionId: webhookData.SubscriptionId,
    //         recurrenceType: webhookData.RecurrenceType,
    //         ...paymentData,
    //     },
    // };

    // // обработка успешной оплаты
    // if (webhookData.Status === 'Completed') {
    //     // Проверяем, не был ли уже обработан этот платеж
    //     const existingPayment = await prisma.subscriptionPayment.findFirst({
    //         where: {
    //             cloudpaymentsTransactionId: webhookData.TransactionId,
    //             status: PurchaseStatus.completed,
    //         },
    //     });

    //     if (existingPayment) {
    
    //         return;
    //     }

    //     const billingStart = new Date();
    //     const billingEnd = calculateNextBillingDate(billingStart, subscription.plan.interval);

    //     // Retry logic for transaction conflicts
    //     let retryCount = 0;
    //     const maxRetries = 3;

    //     while (retryCount < maxRetries) {
    //         try {
    //             let payment;

    //             // Для новой подписки: ищем существующую запись со статусом pending и обновляем её
    //             const pendingPayment = await prisma.subscriptionPayment.findFirst({
    //                 where: {
    //                     subscriptionId: subscription.id,
    //                     status: 'pending',
    //                 },
    //             });

    //             if (pendingPayment) {
    //                 payment = await prisma.subscriptionPayment.update({
    //                     where: { id: pendingPayment.id },
    //                     data: {
    //                         billingStart,
    //                         billingEnd,
    //                         status: PurchaseStatus.completed,
    //                         completedAt: new Date(),
    //                         ...dataForDb,
    //                     },
    //                 });
    //                 console.log(
    //                     `Updated pending payment record ${payment.id} for subscription ${subscription.id}, billing period: ${billingStart.toISOString()} - ${billingEnd.toISOString()}`
    //                 );
    //             } else {
    //                 // откуда возьмется новая?
    //                 // Если pending записи нет, создаем новую (fallback)
    //                 payment = await prisma.subscriptionPayment.create({
    //                     data: {
    //                         subscriptionId: subscription.id,
    //                         billingStart,
    //                         billingEnd,
    //                         status: PurchaseStatus.completed,
    //                         completedAt: new Date(),
    //                         ...dataForDb,
    //                     },
    //                 });
    //                 console.log(
    //                     `Created new payment record ${payment.id} for subscription ${subscription.id} (no pending found), billing period: ${billingStart.toISOString()} - ${billingEnd.toISOString()}`
    //                 );
    //             }

    //             let subscriptionUpdated = false;

    //             if (subscription.status === SubscriptionStatus.pending) {
    //                 // Check if this is a scheduled plan change
    //                 const isScheduledChange = subscription.startDate > new Date();

    //                 if (isScheduledChange) {
    //                     // This is a scheduled plan change - activate the new plan
    
    //                     subscriptionUpdated = await activateSubscription(subscription.id, webhookData.SubscriptionId);

    //                     // Cancel the old subscription if it exists
    //                     const oldSubscription = await prisma.userSubscription.findFirst({
    //                         where: {
    //                             userId: subscription.userId,
    //                             status: SubscriptionStatus.active,
    //                             endDate: {
    //                                 lte: subscription.startDate,
    //                             },
    //                         },
    //                     });

    //                     if (oldSubscription) {
    //                         await prisma.userSubscription.update({
    //                             where: { id: oldSubscription.id },
    //                             data: {
    //                                 status: SubscriptionStatus.cancelled,
    //                                 cancelledAt: new Date(),
    //                                 cancelReason: 'Replaced by scheduled plan change',
    //                             },
    //                         });
    //                         console.log(
    //                             `Cancelled old subscription ${oldSubscription.id} due to scheduled plan change`
    //                         );
    //                     }
    //                 } else {
    //                     // Regular new subscription activation
    //                     subscriptionUpdated = await activateSubscription(subscription.id, webhookData.SubscriptionId);
    //                 }
    //             } else {
    //                 // Продлеваем существующую подписку
    //                 subscriptionUpdated = await extendSubscription(subscription.id, payment.id);
    //             }

    //             // Update subscription metadata with payment information
    //             await prisma.userSubscription.update({
    //                 where: { id: subscription.id },
    //                 data: {
    //                     metadata: {
    //                         ...(subscription.metadata as Record<string, any> | undefined),
    //                         cloudpaymentsStatus: webhookData.Status,
    //                         cloudpaymentsTransactionId: webhookData.TransactionId,
    //                         cloudpaymentsTestMode: webhookData.TestMode === '1',
    //                         lastPaymentDate: new Date().toISOString(),
    //                         ...paymentData,
    //                     },
    //                 },
    //             });

    //             if (subscriptionUpdated) {
    //                 // Perform health check with timeout to prevent hanging
    //                 try {
    //                     const healthCheckPromise = performSubscriptionHealthCheck(subscription.userId);
    //                     const timeoutPromise = new Promise((_, reject) =>
    //                         setTimeout(() => reject(new Error('Health check timeout')), 5000)
    //                     );
    //                     await Promise.race([healthCheckPromise, timeoutPromise]);
    //                 } catch (error) {
    //                     console.warn('Subscription health check failed or timed out:', error);
    //                     // Don't fail the webhook processing if health check fails
    //                 }
    //             }
    //             break; // Success, exit retry loop
    //         } catch (error: any) {
    //             retryCount++;
    //             if (error.code === 'P2034' && retryCount < maxRetries) {
    //                 // Transaction conflict, wait and retry
    //                 console.warn(
    //                     `Transaction conflict for subscription ${subscription.id}, retry ${retryCount}/${maxRetries}`
    //                 );
    //                 await new Promise(resolve => setTimeout(resolve, 100 * retryCount)); // Exponential backoff
    //             } else {
    //                 // Other error or max retries reached
    //                 throw error;
    //             }
    //         }
    //     }
    // } else if (webhookData.Status === 'Failed' || webhookData.Status === 'Cancelled') {
    //     // Создаем запись о неудачном платеже
    //     await prisma.subscriptionPayment.create({
    //         data: {
    //             subscriptionId: subscription.id,
    //             billingStart: new Date(),
    //             billingEnd: new Date(),
    //             status: webhookData.Status === 'Failed' ? PurchaseStatus.failed : PurchaseStatus.canceled,
    //             completedAt: new Date(),
    //             ...dataForDb,
    //         },
    //     });

    //     if (subscription.status === SubscriptionStatus.pending) {
    //         await prisma.userSubscription.update({
    //             where: { id: subscription.id },
    //             data: { status: SubscriptionStatus.failed },
    //         });
    //     }
    // }
}
