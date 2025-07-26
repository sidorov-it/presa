import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';
import { CreateSubscriptionRequest, CreateSubscriptionResponse } from '@/types/subscriptions';
import {
    hasActiveSubscription,
    getCloudPaymentsInterval,
    generateSubscriptionReceipt,
    calculateSubscriptionEndDate,
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

        // Check if user already has an active subscription
        const hasActive = await hasActiveSubscription(session.user.id);
        if (hasActive) {
            return NextResponse.json({ error: 'User already has an active subscription' }, { status: 409 });
        }

        // Get subscription plan
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId, isActive: true },
        });

        if (!plan) {
            return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
        }

        // Create subscription record
        const subscription = await prisma.userSubscription.create({
            data: {
                userId: session.user.id,
                planId: plan.id,
                status: SubscriptionStatus.pending,
                startDate: new Date(),
                endDate: new Date(), // Will be updated after successful payment
                nextBillingDate: new Date(), // Will be updated after successful payment
            },
        });

        // Create initial payment record
        const payment = await prisma.subscriptionPayment.create({
            data: {
                subscriptionId: subscription.id,
                amount: plan.price,
                currency: plan.currency,
                status: 'pending',
                billingStart: new Date(),
                // billingEnd: new Date(),
            },
        });

        // Get CloudPayments recurrent configuration
        const recurrentConfig = getCloudPaymentsInterval(plan.interval);

        // Calculate start date for recurrent payments (next billing cycle)
        const nextBillingDate = calculateSubscriptionEndDate(new Date(), plan.interval);

        // Generate receipt for CloudPayments
        const receipt = generateSubscriptionReceipt(plan, session.user.email);

        console.log('Subscription creation details:', {
            subscriptionId: subscription.id,
            planId: plan.id,
            planName: plan.name,
            planPrice: plan.price,
            planInterval: plan.interval,
            recurrentConfig,
            nextBillingDate: nextBillingDate.toISOString(),
            userId: session.user.id,
            userEmail: session.user.email,
        });

        console.log('Generated receipt:', JSON.stringify(receipt, null, 2));
        console.log('CloudPayments Public ID:', process.env.CLOUDPAYMENTS_PUBLIC_ID);

        const response: CreateSubscriptionResponse = {
            success: true,
            subscriptionId: subscription.id,
            paymentData: {
                subscriptionId: subscription.id,
                amount: plan.price.toString(),
                currency: plan.currency,
                description: `Подписка ${plan.name}`,
                cloudpaymentsData: {
                    publicId: process.env.CLOUDPAYMENTS_PUBLIC_ID!,
                    description: `Подписка ${plan.name}`,
                    amount: plan.price,
                    currency: plan.currency.toUpperCase(),
                    invoiceId: subscription.id,
                    accountId: session.user.id,
                    skin: 'modern',
                    data: {
                        subscriptionId: subscription.id,
                        planId: plan.id,
                        userId: session.user.id,
                    },
                },
                recurrentData: {
                    period: recurrentConfig.period,
                    interval: recurrentConfig.interval,
                    amount: plan.price,
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
