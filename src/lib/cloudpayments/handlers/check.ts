import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseWebhookPayload } from '../parseWebhookPayload';
import ERROR_CODES from './ERROR_CODES';

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
    // обработка первой покупки. достаем данные, переданные в виджет
    if (paymentData.subscriptionId) {
        const { subscriptionId: userSubscriptionId, planId, userId } = paymentData;
        const { OperationType, InvoiceId: invoiceIdFromWebhook } = webhookData;

        if (OperationType !== 'Payment') {
            return NextResponse.json({ code: ERROR_CODES.PAYMENT_NOT_ACCEPTED });
        }

        if (userId !== user.id) {
            return NextResponse.json({ code: ERROR_CODES.INCORRECT_INVOICE });
        }

        // достаем инвойс
        const invoice = await prisma.subscriptionPayment.findFirst({
            where: {
                id: invoiceIdFromWebhook,
            },
        });

        // проверяем статус pending
        if (!invoice || invoice.status !== 'pending') {
            return NextResponse.json({ code: ERROR_CODES.INCORRECT_INVOICE });
        }

        // сравниванием, что данные в инвойсе совпадают с данными из хука
        // if (invoice.amount !== Amount) {
        //     return NextResponse.json({ code: ERROR_CODES.INCORRECT_AMOUNT });
        // }

        if (invoice.subscriptionPlanId !== planId) {
            return NextResponse.json({ code: ERROR_CODES.INCORRECT_INVOICE });
        }

        if (invoice.userSubscriptionId !== userSubscriptionId) {
            return NextResponse.json({ code: ERROR_CODES.INCORRECT_INVOICE });
        }

        return NextResponse.json({ code: 0 });
    } else {
        // если paymentData пустой, то это автоматическое продление подписки

        const { AccountId: userId, SubscriptionId: cloudpaymentsSubscriptionId } = webhookData;

        // находим подписку по cloudpaymentsId и userId
        const userSubscription = await prisma.userSubscription.findFirst({
            where: {
                userId,
                cloudpaymentsSubscriptionId,
            },
        });

        if (userSubscription) {
            return NextResponse.json({ code: 0 });
        }

        return NextResponse.json({ code: ERROR_CODES.INCORRECT_INVOICE });
    }
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
        console.warn(`Check mismatch amount: got ${amount}, expected ${purchase.price} for purchase ${purchase.id}`);
        // Return code: 0 to allow the payment
    }

    return NextResponse.json({ code: 0 });
}
