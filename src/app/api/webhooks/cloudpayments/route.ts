import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { activateSubscription, performSubscriptionHealthCheck, extendSubscription } from '@/utils/subscriptions';
import { SubscriptionStatus } from '@prisma/client';

interface CloudPaymentsWebhookData {
    TransactionId: string;
    Amount: string;
    Currency: string;
    DateTime: string;
    CardFirstSix?: string;
    CardLastFour?: string;
    CardType?: string;
    CardExpDate?: string;
    TestMode: string;
    Status: string;
    OperationType?: string;
    InvoiceId?: string;
    AccountId?: string;
    SubscriptionId?: string;
    Name?: string;
    Email?: string;
    Data?: string;
    Token?: string;
    TotalFee?: string;
    RecurrenceType?: 'Init' | 'Auto';
}

export async function POST(request: NextRequest) {
    try {
        console.log('CloudPayments webhook received');

        const headersList = await headers();
        const contentType = headersList.get('content-type');

        let webhookData: CloudPaymentsWebhookData;

        if (contentType?.includes('application/json')) {
            webhookData = await request.json();
        } else {
            // Handle form-encoded data
            const formData = await request.formData();
            webhookData = Object.fromEntries(formData.entries()) as any;
        }

        console.log('Webhook data:', JSON.stringify(webhookData, null, 2));

        // Parse additional data from webhook
        let paymentData: any = {};
        try {
            if (webhookData.Data) {
                paymentData = JSON.parse(webhookData.Data);
                console.log('Payment data:', paymentData);
            }
        } catch (error) {
            console.warn('Failed to parse payment data:', webhookData.Data);
        }

        // Determine if this is a token purchase or subscription payment
        // Check for subscription indicators: subscriptionId in data or CloudPayments.recurrent config
        const isSubscriptionPayment =
            paymentData.subscriptionId ||
            paymentData.CloudPayments?.recurrent ||
            webhookData.SubscriptionId ||
            webhookData.RecurrenceType;

        console.log('Is subscription payment:', isSubscriptionPayment);

        if (isSubscriptionPayment) {
            await handleSubscriptionPayment(webhookData, paymentData);
        } else {
            await handleTokenPurchase(webhookData);
        }

        return NextResponse.json({ code: 0 });
    } catch (error) {
        console.error('CloudPayments webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

async function handleTokenPurchase(webhookData: CloudPaymentsWebhookData) {
    console.log('Processing token purchase webhook');

    const { TransactionId, Amount, Status, InvoiceId, AccountId } = webhookData;

    if (!InvoiceId || !AccountId) {
        console.error('Missing required fields for token purchase:', { InvoiceId, AccountId });
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        if (Status === 'Completed') {
            // Find the purchase record
            const purchase = await prisma.tokenPurchase.findUnique({
                where: { id: InvoiceId },
                include: { package: true },
            });

            if (!purchase) {
                console.error('Purchase not found:', InvoiceId);
                return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
            }

            if (purchase.status === 'completed') {
                console.log('Purchase already completed:', InvoiceId);
                return NextResponse.json({ message: 'Already processed' });
            }

            // Update purchase status
            await prisma.tokenPurchase.update({
                where: { id: InvoiceId },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                    cloudpaymentsTransactionId: TransactionId,
                },
            });

            // Add tokens to user account
            await prisma.user.update({
                where: { id: AccountId },
                data: {
                    tokens: {
                        increment: purchase.package.tokens,
                    },
                },
            });

            console.log(`Token purchase completed: ${purchase.package.tokens} tokens added to user ${AccountId}`);
        } else {
            // Handle failed payment
            await prisma.tokenPurchase.update({
                where: { id: InvoiceId },
                data: { status: 'failed' },
            });
            console.log(`Token purchase failed: ${InvoiceId}`);
        }

        return NextResponse.json({ message: 'Token purchase processed successfully' });
    } catch (error) {
        console.error('Error processing token purchase webhook:', error);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}

async function handleSubscriptionPayment(webhookData: CloudPaymentsWebhookData, paymentData: any) {
    console.log('Processing subscription payment webhook');

    const {
        TransactionId,
        Amount,
        Status,
        InvoiceId,
        AccountId,
        RecurrenceType,
        DateTime,
        SubscriptionId: webhookSubscriptionId,
    } = webhookData;

    // Получение локального subscriptionId из paymentData или InvoiceId
    const fallbackSubscriptionId = paymentData?.subscriptionId || InvoiceId;

    let subscription = null;

    // Сначала ищем по cloudpaymentsId (это webhookData.SubscriptionId)
    if (webhookSubscriptionId) {
        subscription = await prisma.userSubscription.findFirst({
            where: { cloudpaymentsId: webhookSubscriptionId },
            include: { plan: true },
        });

        if (subscription) {
            console.log(`Subscription found by cloudpaymentsId: ${webhookSubscriptionId}`);
        }
    }

    // Если не нашли — пробуем по локальному ID (из paymentData)
    if (!subscription && fallbackSubscriptionId) {
        subscription = await prisma.userSubscription.findUnique({
            where: { id: fallbackSubscriptionId },
            include: { plan: true },
        });

        if (subscription) {
            console.log(`Subscription found by local ID: ${fallbackSubscriptionId}`);

            if (webhookSubscriptionId) {
                await prisma.userSubscription.update({
                    where: { id: subscription.id },
                    data: { cloudpaymentsId: webhookSubscriptionId },
                });
            }
        }
    }

    if (!subscription) {
        console.error('Subscription not found');
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Безопасно сохраняем cloudpaymentsId (если не установлен)
    if (!subscription.cloudpaymentsId && webhookSubscriptionId) {
        await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: { cloudpaymentsId: webhookSubscriptionId },
        });
        console.log(`Saved cloudpaymentsId: ${webhookSubscriptionId}`);
    }

    // Создание/обновление платежа
    const existingPayment = await prisma.subscriptionPayment.findFirst({
        where: {
            subscriptionId: subscription.id,
            // cloudpaymentsId: InvoiceId,
        },
    });

    const paymentDataRecord = {
        subscriptionId: subscription.id,
        amount: parseFloat(Amount),
        currency: subscription.plan.currency,
        status: Status.toLowerCase(),
        cloudpaymentsId: InvoiceId,
        paymentMethod: webhookData.CardType || 'card',
        createdAt: new Date(DateTime),
    };

    let payment;
    if (existingPayment) {
        console.log(`Updating existing payment: ${existingPayment.id}`);
        payment = await prisma.subscriptionPayment.update({
            where: { id: existingPayment.id },
            data: { status: Status.toLowerCase() },
        });
    } else {
        console.log('Creating new payment record');
        payment = await prisma.subscriptionPayment.create({
            data: paymentDataRecord,
        });
    }

    if (Status === 'Completed') {
        const isInitialPayment =
            RecurrenceType === 'Init' ||
            subscription.status === SubscriptionStatus.pending ||
            !paymentData.CloudPayments?.recurrent;

        if (isInitialPayment) {
            console.log(`Activating subscription ${subscription.id}`);
            await activateSubscription(subscription.id, webhookSubscriptionId || '');
        } else {
            console.log(`Extending subscription ${subscription.id}`);
            await extendSubscription(subscription.id, payment.id);
        }

        await performSubscriptionHealthCheck(subscription.userId);
        console.log(`Subscription payment processed successfully: ${subscription.id}`);
    } else if (Status === 'Failed' || Status === 'Cancelled') {
        if (subscription.status === SubscriptionStatus.pending) {
            console.log(`Marking subscription ${subscription.id} as failed`);
            await prisma.userSubscription.update({
                where: { id: subscription.id },
                data: { status: SubscriptionStatus.failed },
            });
        }
        console.log(`Subscription payment failed: ${subscription.id}, Status: ${Status}`);
    }

    return NextResponse.json({ code: 0 });
}
