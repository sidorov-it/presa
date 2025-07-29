import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { SubscriptionPayment, SubscriptionStatus, UserSubscription } from '@prisma/client';
import { CreateSubscriptionRequest, CreateSubscriptionResponse } from '@/types/subscriptions';
import {
    getCloudPaymentsInterval,
    generateSubscriptionReceipt,
    calculateSubscriptionEndDate,
    validateAndSyncSubscriptionStatus,
    calculateNextBillingDate,
} from '@/utils/subscriptions';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: CreateSubscriptionRequest = await request.json();
        const { planId } = body;

        if (!planId) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        // получаем план подписки
        const subscriptionPlan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId, isActive: true },
        });

        // подписка не найдена
        if (!subscriptionPlan) {
            return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
        }

        await validateAndSyncSubscriptionStatus(session.user.id);

        // получаем все подписки пользователя
        const userSubscriptions = await prisma.userSubscription.findMany({
            where: { userId: session.user.id },
        });

        // проверяем, есть ли уже активная подписка
        const activeSubscription = userSubscriptions.find(
            subscription => subscription.status === SubscriptionStatus.active
        );

        // уже есть активная подписка. новую не даем оплатить
        if (activeSubscription) {
            return NextResponse.json({ error: 'User already has an active subscription' }, { status: 409 });
        }

        // проверяем, есть ли подписка с таким планом в статусе pending?
        const pendingSubscription = userSubscriptions.find(
            subscription =>
                subscription.status === SubscriptionStatus.pending &&
                subscription.subscriptionPlanId === subscriptionPlan.id
        );

        let userSubscription: UserSubscription;
        let payment: SubscriptionPayment | null = null;

        // если есть подписка в статусе pending, обновляем даты
        if (pendingSubscription) {
            // обновляем startDate endDate updatedAt
            userSubscription = await prisma.userSubscription.update({
                where: { id: pendingSubscription.id },
                data: {
                    startDate: new Date(),
                    endDate: calculateSubscriptionEndDate(new Date(), subscriptionPlan.interval),
                    nextBillingDate: calculateNextBillingDate(new Date(), subscriptionPlan.interval),
                    updatedAt: new Date(),
                },
            });

            // проверяем, есть ли уже счет на оплату
            payment = await prisma.subscriptionPayment.findFirst({
                where: { userSubscriptionId: pendingSubscription.id },
            });

            // если нет - создаем

            if (!payment) {
                payment = await prisma.subscriptionPayment.create({
                    data: {
                        userSubscriptionId: pendingSubscription.id,
                        subscriptionPlanId: subscriptionPlan.id,
                        amount: subscriptionPlan.price,
                        currency: subscriptionPlan.currency,
                        billingStart: new Date(),
                        billingEnd: calculateSubscriptionEndDate(new Date(), subscriptionPlan.interval),
                        status: 'pending',
                        // userSubscriptionId: pendingSubscription.id,
                        // subscriptionPlanId: subscriptionPlan.id,
                        // amount: subscriptionPlan.price,
                        // currency: subscriptionPlan.currency,
                        // status: 'pending',
                        // billingStart: new Date(),
                    },
                });
            } else {
                payment = await prisma.subscriptionPayment.update({
                    where: { id: payment.id },
                    data: {
                        billingStart: new Date(),
                        billingEnd: calculateSubscriptionEndDate(new Date(), subscriptionPlan.interval),
                    },
                });
            }
        } else {
            // создаем новую подписку
            userSubscription = await prisma.userSubscription.create({
                data: {
                    userId: session.user.id,
                    subscriptionPlanId: subscriptionPlan.id,
                    status: SubscriptionStatus.pending,
                    startDate: new Date(),
                    endDate: calculateSubscriptionEndDate(new Date(), subscriptionPlan.interval),
                    nextBillingDate: calculateNextBillingDate(new Date(), subscriptionPlan.interval),
                },
            });

            payment = await prisma.subscriptionPayment.create({
                data: {
                    userSubscriptionId: userSubscription.id,
                    subscriptionPlanId: subscriptionPlan.id,
                    amount: subscriptionPlan.price,
                    currency: subscriptionPlan.currency,
                    status: 'pending',
                    billingStart: new Date(),
                },
            });
        }

        // Get CloudPayments recurrent configuration
        const recurrentConfig = getCloudPaymentsInterval(subscriptionPlan.interval);
        const nextBillingDate = calculateNextBillingDate(new Date(), subscriptionPlan.interval);

        // Generate receipt for CloudPayments
        const receipt = generateSubscriptionReceipt(subscriptionPlan, session.user.email);

        console.log('Subscription creation details:', {
            userSubscriptionId: userSubscription.id,
            planId: subscriptionPlan.id,
            planName: subscriptionPlan.name,
            planPrice: subscriptionPlan.price,
            planInterval: subscriptionPlan.interval,
            recurrentConfig,
            userId: session.user.id,
            userEmail: session.user.email,
        });

        const response: CreateSubscriptionResponse = {
            success: true,
            publicId: process.env.CLOUDPAYMENTS_PUBLIC_ID!,

            // subscriptionId: subscription.id,
            paymentData: {
                userSubscriptionId: userSubscription.id,
                amount: subscriptionPlan.price.toString(),
                currency: subscriptionPlan.currency.toUpperCase(),
                description: `Подписка ${subscriptionPlan.name}`,
                invoiceId: payment.id,
                userId: session.user.id,
                planId: subscriptionPlan.id,

                recurrentData: {
                    period: recurrentConfig.period,
                    interval: recurrentConfig.interval,
                    amount: subscriptionPlan.price,
                    startDate: nextBillingDate.toISOString(),
                    maxPeriods: undefined, // Unlimited recurring payments
                    receipt,
                },
            },
        };

        console.log('API response:', JSON.stringify(response, null, 2));

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
