import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseWebhookPayload } from '../parseWebhookPayload';
import { SubscriptionStatus } from '@prisma/client';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { webhookData, paymentData } = await parseWebhookPayload(request);
        const userId = webhookData.AccountId;
        const isSubscription = Boolean(webhookData.SubscriptionId) || Boolean(paymentData.subscriptionId);

        if (!userId) {
            return NextResponse.json({ code: 13, message: 'Пользователь не найден' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ code: 13, message: 'Пользователь не найден' });
        }

        if (isSubscription) {
            return await handleSubscriptionCheck(webhookData, paymentData, user);
        } else {
            return await handleTokenPurchaseCheck(webhookData, paymentData, user);
        }
    } catch (error) {
        console.error('Error in checkHandler:', error);
        return NextResponse.json({ code: 99, message: 'Внутренняя ошибка' });
    }
}

async function handleSubscriptionCheck(
    webhookData: any,
    paymentData: Record<string, any>,
    user: any
): Promise<NextResponse> {
    const subscriptionId = webhookData.SubscriptionId || paymentData.subscriptionId;
    
    if (!subscriptionId) {
        return NextResponse.json({ code: 14, message: 'Подписка не найдена' });
    }

    const subscription = await prisma.userSubscription.findFirst({
        where: {
            userId: user.id,
            cloudpaymentsId: webhookData.SubscriptionId,
        },
        include: { plan: true },
    });

    if (!subscription) {
        return NextResponse.json({ code: 14, message: 'Подписка не найдена' });
    }

    // Не отклоняем по истечению срока действия — подписку можно продлить
    const isCancellableStatus = subscription.status === SubscriptionStatus.cancelled;

    if (isCancellableStatus) {
        return NextResponse.json({ code: 15, message: 'Подписка отменена' });
    }

    // Можно добавить логирование отклонённых статусов:
    if (subscription.status === SubscriptionStatus.failed || subscription.status === SubscriptionStatus.expired) {
        console.warn(`Subscription ${subscription.id} in status "${subscription.status}", but allowing renewal.`);
    }

    // Проверка суммы (логируем, но не блокируем)
    const amount = parseFloat(webhookData.Amount);
    if (!Number.isNaN(amount) && subscription.plan && amount !== subscription.plan.price) {
        console.warn(
            `Check mismatch amount: got ${amount}, expected ${subscription.plan.price} for subscription ${subscription.id}`
        );
        // Можно вернуть code: 0, чтобы не блокировать, если точно уверены
    }

    return NextResponse.json({ code: 0 });
}

async function handleTokenPurchaseCheck(
    webhookData: any,
    paymentData: Record<string, any>,
    user: any
): Promise<NextResponse> {
    const purchaseId = webhookData.InvoiceId;
    
    if (!purchaseId) {
        return NextResponse.json({ code: 14, message: 'Покупка не найдена' });
    }

    const purchase = await prisma.tokenPurchase.findFirst({
        where: {
            id: purchaseId,
            userId: user.id,
        },
        include: { package: true },
    });

    if (!purchase) {
        return NextResponse.json({ code: 14, message: 'Покупка не найдена' });
    }

    // Check if purchase is already completed
    if (purchase.status === 'completed') {
        return NextResponse.json({ code: 0 }); // Already completed, allow
    }

    // Check if purchase is cancelled
    if (purchase.status === 'canceled') {
        return NextResponse.json({ code: 15, message: 'Покупка отменена' });
    }

    // Check amount (log but don't block)
    const amount = parseFloat(webhookData.Amount);
    if (!Number.isNaN(amount) && amount !== purchase.price) {
        console.warn(
            `Check mismatch amount: got ${amount}, expected ${purchase.price} for purchase ${purchase.id}`
        );
        // Return code: 0 to allow the payment
    }

    return NextResponse.json({ code: 0 });
}
