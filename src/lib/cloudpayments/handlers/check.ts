import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseWebhookPayload } from '../parseWebhookPayload';
import { SubscriptionStatus } from '@prisma/client';

export async function POST(request: NextRequest): Promise<NextResponse> {
    const { webhookData, paymentData } = await parseWebhookPayload(request);

    const subscriptionId =
        webhookData.SubscriptionId || paymentData.subscriptionId;

    if (!webhookData.AccountId || !subscriptionId) {
        return NextResponse.json({ code: 14, message: 'Подписка не найдена' });
    }

    const user = await prisma.user.findUnique({
        where: { id: webhookData.AccountId },
    });

    if (!user) {
        return NextResponse.json({ code: 13, message: 'Пользователь не найден' });
    }

    const subscription = await prisma.userSubscription.findFirst({
        where: {
            userId: user.id,
            OR: [
                { id: subscriptionId },
                { cloudpaymentsId: webhookData.SubscriptionId },
            ],
        },
        include: { plan: true },
    });

    if (!subscription) {
        return NextResponse.json({ code: 14, message: 'Подписка не найдена' });
    }

    if (
        subscription.status === SubscriptionStatus.cancelled ||
        subscription.status === SubscriptionStatus.expired ||
        subscription.status === SubscriptionStatus.failed ||
        subscription.endDate < new Date()
    ) {
        return NextResponse.json({ code: 15, message: 'Подписка неактивна' });
    }

    if (
        subscription.status !== SubscriptionStatus.active &&
        subscription.status !== SubscriptionStatus.pending
    ) {
        return NextResponse.json({
            code: 16,
            message: 'Подписка не готова к продлению',
        });
    }

    const amount = parseFloat(webhookData.Amount);
    if (
        !Number.isNaN(amount) &&
        subscription.plan &&
        amount !== subscription.plan.price
    ) {
        return NextResponse.json({ code: 10, message: 'Неверная сумма платежа' });
    }

    return NextResponse.json({ code: 0 });
}
