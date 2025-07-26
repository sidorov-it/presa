import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseRecurrentWebhookPayload, CloudPaymentsRecurrentWebhookData } from '../parseWebhookPayload';
import { SubscriptionStatus } from '@prisma/client';
import { performSubscriptionHealthCheck } from '@/utils/subscriptions';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { webhookData, paymentData } = await parseRecurrentWebhookPayload(request);

        await handleRecurrentNotification(webhookData, paymentData);

        return NextResponse.json({ code: 0 });
    } catch (error) {
        console.error('CloudPayments recurrent handler error:', error);
        return NextResponse.json({ error: 'Recurrent webhook processing failed' }, { status: 500 });
    }
}

async function handleRecurrentNotification(
    webhookData: CloudPaymentsRecurrentWebhookData,
    paymentData: Record<string, any>
) {
    console.log('Processing recurrent notification:', webhookData);

    // Validate required fields to prevent Prisma errors
    if (!webhookData.Id || !webhookData.AccountId) {
        console.warn('Invalid recurrent webhook data: missing Id or AccountId');
        return;
    }

    // Находим подписку по CloudPayments ID
    const subscription = await prisma.userSubscription.findFirst({
        where: {
            cloudpaymentsId: webhookData.Id,
            userId: webhookData.AccountId,
        },
        include: { plan: true },
    });

    if (!subscription) {
        console.warn(`Subscription not found for CloudPayments ID: ${webhookData.Id}`);
        return;
    }

    // Обновляем статус подписки в соответствии с уведомлением
    let newStatus: SubscriptionStatus;
    const updateData: any = {
        metadata: {
            ...(subscription.metadata as Record<string, any> | undefined),
            lastRecurrentNotification: {
                status: webhookData.Status,
                successfulTransactions: webhookData.SuccessfulTransactionsNumber,
                failedTransactions: webhookData.FailedTransactionsNumber,
                lastTransactionDate: webhookData.LastTransactionDate,
                nextTransactionDate: webhookData.NextTransactionDate,
                receivedAt: new Date().toISOString(),
                ...paymentData,
            },
        },
    };

    switch (webhookData.Status) {
        case 'Active':
            newStatus = SubscriptionStatus.active;
            break;
        case 'PastDue':
            // Просроченная подписка - оставляем активной, но добавляем флаг
            newStatus = SubscriptionStatus.active;
            updateData.metadata.pastDue = true;
            updateData.metadata.pastDueDate = new Date().toISOString();
            break;
        case 'Cancelled':
            newStatus = SubscriptionStatus.cancelled;
            updateData.cancelledAt = new Date();
            updateData.cancelReason = 'Cancelled via CloudPayments recurrent notification';
            break;
        case 'Rejected':
            newStatus = SubscriptionStatus.failed;
            updateData.metadata.rejectionReason = 'Rejected via CloudPayments recurrent notification';
            break;
        case 'Expired':
            newStatus = SubscriptionStatus.expired;
            break;
        default:
            console.warn(`Unknown recurrent status: ${webhookData.Status}`);
            return;
    }

    // Обновляем подписку
    await prisma.userSubscription.update({
        where: { id: subscription.id },
        data: {
            status: newStatus,
            ...updateData,
        },
    });

    // Если есть информация о следующем платеже, обновляем дату
    if (webhookData.NextTransactionDate) {
        try {
            const nextTransactionDate = new Date(webhookData.NextTransactionDate);
            // Validate that the date is valid
            if (!isNaN(nextTransactionDate.getTime())) {
                await prisma.userSubscription.update({
                    where: { id: subscription.id },
                    data: { nextBillingDate: nextTransactionDate },
                });
            } else {
                console.warn(`Invalid NextTransactionDate format: ${webhookData.NextTransactionDate}`);
            }
        } catch (error) {
            console.error('Error parsing NextTransactionDate:', error);
        }
    }

    // Выполняем проверку здоровья подписки
    await performSubscriptionHealthCheck(webhookData.AccountId);

    console.log(`Subscription ${subscription.id} status updated to ${newStatus}`);
}
