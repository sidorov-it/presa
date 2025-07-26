import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PurchaseStatus, TransactionType, SubscriptionStatus } from '@prisma/client';
import { addTokens } from '@/utils/tokens';
import { activateSubscription, calculateNextBillingDate } from '@/utils/subscriptions';

interface CloudPaymentsWebhookData {
    TransactionId: string;
    Amount: string;
    Currency: string;
    PaymentAmount: string;
    PaymentCurrency: string;
    OperationType: string;
    InvoiceId: string;
    AccountId: string;
    Status: string;
    Description: string;
    TestMode: string;
    Data: string;
    DateTime: string;
    // Subscription-specific fields
    SubscriptionId?: string;
    RecurrenceType?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Получаем данные как form-urlencoded
        const formData = await request.formData();

        // Преобразуем FormData в объект
        const webhookData: CloudPaymentsWebhookData = {
            TransactionId: formData.get('TransactionId') as string,
            Amount: formData.get('Amount') as string,
            Currency: formData.get('Currency') as string,
            PaymentAmount: formData.get('PaymentAmount') as string,
            PaymentCurrency: formData.get('PaymentCurrency') as string,
            OperationType: formData.get('OperationType') as string,
            InvoiceId: formData.get('InvoiceId') as string,
            AccountId: formData.get('AccountId') as string,
            Status: formData.get('Status') as string,
            Description: formData.get('Description') as string,
            TestMode: formData.get('TestMode') as string,
            Data: formData.get('Data') as string,
            DateTime: formData.get('DateTime') as string,
            SubscriptionId: formData.get('SubscriptionId') as string,
            RecurrenceType: formData.get('RecurrenceType') as string,
        };

        await prisma.cloudPaymentsWebhookLog.create({
            data: {
                transactionId: webhookData.TransactionId,
                invoiceId: webhookData.InvoiceId,
                accountId: webhookData.AccountId,
                status: webhookData.Status,
                operationType: webhookData.OperationType,
                testMode: webhookData.TestMode === '1',
                rawData: Object.fromEntries(formData.entries()),
            }
        });

        console.log('CloudPayments webhook received:', webhookData);

        // Parse additional data
        let additionalData = {};
        try {
            if (webhookData.Data) {
                additionalData = JSON.parse(webhookData.Data);
            }
        } catch (e) {
            console.warn('Failed to parse additional data:', webhookData.Data);
        }

        // Check if this is a subscription payment or token purchase
        const isSubscriptionPayment = webhookData.SubscriptionId || webhookData.RecurrenceType;

        if (isSubscriptionPayment) {
            return await handleSubscriptionPayment(webhookData, additionalData);
        } else {
            return await handleTokenPurchase(webhookData, additionalData);
        }
    } catch (error) {
        console.error('Error processing CloudPayments webhook:', error);
        return NextResponse.json({
            error: 'Webhook processing failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

async function handleTokenPurchase(webhookData: CloudPaymentsWebhookData, additionalData: any) {
    // Find token purchase by InvoiceId
    const purchase = await prisma.tokenPurchase.findFirst({
        where: { id: webhookData.InvoiceId },
        include: { package: true },
    });

    if (!purchase) {
        console.error('Purchase not found for InvoiceId:', webhookData.InvoiceId);
        return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    if (purchase.status === PurchaseStatus.completed && purchase.metadata?.cloudpaymentsTxId === webhookData.TransactionId) {
        console.log('Duplicate webhook received — already processed');
        return NextResponse.json({ code: 0 });
    }

    // Update purchase status based on CloudPayments status
    if (webhookData.Status === 'Completed') {
        // Complete purchase and add tokens
        await prisma.$transaction(async (tx) => {
            const updatedPurchaseData = {
                status: PurchaseStatus.completed,
                completedAt: new Date(),
                metadata: {
                    ...(purchase.metadata as Record<string, any> || {}),
                    cloudpaymentsStatus: webhookData.Status,
                    cloudpaymentsTransactionId: webhookData.TransactionId,
                    cloudpaymentsAmount: webhookData.Amount,
                    cloudpaymentsCurrency: webhookData.Currency,
                    cloudpaymentsDateTime: webhookData.DateTime,
                    cloudpaymentsTestMode: webhookData.TestMode === '1',
                    cloudpaymentsTxId: webhookData.TransactionId,
                    ...additionalData,
                },
            };

            const updatedPurchase = await tx.tokenPurchase.update({
                where: { id: purchase.id },
                data: updatedPurchaseData
            });

            console.log('updatedPurchase', updatedPurchase);

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
                    cloudpaymentsData: additionalData,
                }
            );
        });

        console.log('Payment completed successfully:', {
            purchaseId: purchase.id,
            transactionId: webhookData.TransactionId,
            amount: webhookData.Amount,
            tokensAdded: purchase.tokensAmount,
        });
    } else if (webhookData.Status === 'Failed' || webhookData.Status === 'Cancelled') {
        await prisma.tokenPurchase.update({
            where: { id: purchase.id },
            data: {
                status: webhookData.Status === 'Failed' ? PurchaseStatus.failed : PurchaseStatus.canceled,
                metadata: {
                    ...(purchase.metadata as Record<string, any> || {}),
                    cloudpaymentsStatus: webhookData.Status,
                    cloudpaymentsTransactionId: webhookData.TransactionId,
                    cloudpaymentsDateTime: webhookData.DateTime,
                    cloudpaymentsTestMode: webhookData.TestMode === '1',
                    ...additionalData,
                },
            },
        });

        console.log('Payment failed/cancelled:', {
            purchaseId: purchase.id,
            transactionId: webhookData.TransactionId,
            status: webhookData.Status,
        });
    }

    return NextResponse.json({ code: 0 });
}

async function handleSubscriptionPayment(webhookData: CloudPaymentsWebhookData, additionalData: any) {
    // Find subscription by InvoiceId (which should be the subscription ID)
    const subscription = await prisma.userSubscription.findFirst({
        where: { id: webhookData.InvoiceId },
        include: { plan: true },
    });

    if (!subscription) {
        console.error('Subscription not found for InvoiceId:', webhookData.InvoiceId);
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Create or update subscription payment record
    let payment = await prisma.subscriptionPayment.findFirst({
        where: {
            subscriptionId: subscription.id,
            cloudpaymentsId: webhookData.TransactionId,
        },
    });

    const paymentData = {
        amount: parseFloat(webhookData.Amount),
        currency: webhookData.Currency,
        cloudpaymentsId: webhookData.TransactionId,
        metadata: {
            cloudpaymentsStatus: webhookData.Status,
            cloudpaymentsDateTime: webhookData.DateTime,
            cloudpaymentsTestMode: webhookData.TestMode === '1',
            subscriptionId: webhookData.SubscriptionId,
            recurrenceType: webhookData.RecurrenceType,
            ...additionalData,
        },
    };

    if (webhookData.Status === 'Completed') {
        if (!payment) {
            // Create new payment record for recurring payment
            const billingStart = new Date();
            const billingEnd = calculateNextBillingDate(billingStart, subscription.plan.interval);
            
            payment = await prisma.subscriptionPayment.create({
                data: {
                    subscriptionId: subscription.id,
                    billingStart,
                    billingEnd,
                    status: PurchaseStatus.completed,
                    completedAt: new Date(),
                    ...paymentData,
                },
            });
        } else {
            // Update existing payment
            payment = await prisma.subscriptionPayment.update({
                where: { id: payment.id },
                data: {
                    status: PurchaseStatus.completed,
                    completedAt: new Date(),
                    ...paymentData,
                },
            });
        }

        // Activate or extend subscription
        if (subscription.status === SubscriptionStatus.pending) {
            // First-time activation
            await activateSubscription(subscription.id, webhookData.TransactionId);
        } else if (subscription.status === SubscriptionStatus.active) {
            // Recurring payment - extend subscription
            const newEndDate = calculateNextBillingDate(subscription.endDate, subscription.plan.interval);
            const nextBillingDate = calculateNextBillingDate(newEndDate, subscription.plan.interval);

            await prisma.userSubscription.update({
                where: { id: subscription.id },
                data: {
                    endDate: newEndDate,
                    nextBillingDate,
                    lastPaymentId: payment.id,
                },
            });
        }

        console.log('Subscription payment completed successfully:', {
            subscriptionId: subscription.id,
            transactionId: webhookData.TransactionId,
            amount: webhookData.Amount,
            isRecurring: !!webhookData.RecurrenceType,
        });
    } else if (webhookData.Status === 'Failed' || webhookData.Status === 'Cancelled') {
        if (payment) {
            await prisma.subscriptionPayment.update({
                where: { id: payment.id },
                data: {
                    status: webhookData.Status === 'Failed' ? PurchaseStatus.failed : PurchaseStatus.canceled,
                    ...paymentData,
                },
            });
        }

        // If subscription is pending and payment failed, mark subscription as failed
        if (subscription.status === SubscriptionStatus.pending) {
            await prisma.userSubscription.update({
                where: { id: subscription.id },
                data: {
                    status: SubscriptionStatus.failed,
                },
            });
        }

        console.log('Subscription payment failed/cancelled:', {
            subscriptionId: subscription.id,
            transactionId: webhookData.TransactionId,
            status: webhookData.Status,
        });
    }

    return NextResponse.json({ code: 0 });
} 