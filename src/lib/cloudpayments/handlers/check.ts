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
        const { invoiceId, subscriptionId: userSubscriptionId, planId, userId } = paymentData;
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

        const { AccountId: userId, SubscriptionId: cloudpaymentsSubscriptionId, Status } = webhookData;

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

    // return NextResponse.json({ code: 0 });
    // сравниванием, что данные в инвойсе совпадают с данными из хука
    // // id подписки
    // // сраниванием id пакета
    // // стоимость и валюту
    //

    // проверяем пользователя AccountId, InvoiceId, SubscriptionId, OperationType, Amount, Currency
    // проверяем planId, subscriptionId, userId
    // что-то делаем с TransactionId?

    // проверяем наличие пользователя, плана, инвойса, подписки
    // если все есть - code: 0

    // if (webhookData.OperationType !== 'Payment') {
    //     return NextResponse.json({ code: 14, message: 'Операция не является платежом' });
    // }

    // const subscriptionPlan = await prisma.subscriptionPlan.findFirst({
    //     where: {
    //         id: webhookData.PlanId,
    //     },
    // });

    // if (!subscriptionPlan) {
    //     return NextResponse.json({ code: ERROR_CODES.INCORRECT_INVOICE });
    // }

    // const invoice = await prisma.subscriptionPayment.findFirst({
    //     where: {
    //         id: webhookData.InvoiceId,
    //     },
    // });

    // if (!invoice || invoice.status !== 'pending') {
    //     return NextResponse.json({ code: ERROR_CODES.INCORRECT_INVOICE });
    // }

    // const userSubscription = await prisma.userSubscription.findFirst({
    //     where: {
    //         userId: user.id,
    //         subscriptionId: invoice.subscriptionId,
    //     },
    // });

    // if (userSubscription.planId !== subscriptionPlan.id) {
    //     return NextResponse.json({ code: ERROR_CODES.INCORRECT_INVOICE });
    // }

    // if (!userSubscription) {
    //     return NextResponse.json({ code: ERROR_CODES.INCORRECT_INVOICE });
    // }

    // const userId = webhookData.AccountId;
    // const invoiceId = webhookData.InvoiceId;
    // const subscriptionId = webhookData.SubscriptionId;
    // const operationType = webhookData.OperationType;
    // const amount = webhookData.Amount;
    // const currency = webhookData.Currency;

    // if (!subscriptionId) {
    //     return NextResponse.json({ code: 14, message: 'Подписка не найдена' });
    // }

    // // оплата подписки
    // const subscription = await prisma.userSubscription.findFirst({
    //     where: {
    //         userId: user.id,
    //         cloudpaymentsId: webhookData.SubscriptionId,
    //     },
    //     include: { plan: true },
    // });

    // if (!subscription) {
    //     return NextResponse.json({ code: 14, message: 'Подписка не найдена' });
    // }

    // // Не отклоняем по истечению срока действия — подписку можно продлить
    // const isCancellableStatus = subscription.status === SubscriptionStatus.cancelled;

    // if (isCancellableStatus) {
    //     return NextResponse.json({ code: 15, message: 'Подписка отменена' });
    // }

    // // Можно добавить логирование отклонённых статусов:
    // if (subscription.status === SubscriptionStatus.failed || subscription.status === SubscriptionStatus.expired) {
    //     console.warn(`Subscription ${subscription.id} in status "${subscription.status}", but allowing renewal.`);
    // }

    // // Проверка суммы (логируем, но не блокируем)
    // const amount = parseFloat(webhookData.Amount);
    // if (!Number.isNaN(amount) && subscription.plan && amount !== subscription.plan.price) {
    //     console.warn(
    //         `Check mismatch amount: got ${amount}, expected ${subscription.plan.price} for subscription ${subscription.id}`
    //     );
    //     // Можно вернуть code: 0, чтобы не блокировать, если точно уверены
    // }

    // return NextResponse.json({ code: 0 });
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
