import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';
import { CreateSubscriptionRequest } from '@/types/subscriptions';
import { calculateSubscriptionEndDate } from '@/utils/subscriptions';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { planId, returnUrl }: CreateSubscriptionRequest = await request.json();
        if (!planId) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        // Get subscription plan
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId, isActive: true },
        });
        if (!plan) {
            return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
        }

        // Check if user already has an active subscription
        const existingSubscription = await prisma.userSubscription.findFirst({
            where: {
                userId: session.user.id,
                status: SubscriptionStatus.active,
                endDate: {
                    gte: new Date(),
                },
            },
        });

        if (existingSubscription) {
            return NextResponse.json(
                { error: 'You already have an active subscription. Please cancel it first to switch plans.' },
                { status: 409 }
            );
        }

        // Create subscription record
        const startDate = new Date();
        const endDate = calculateSubscriptionEndDate(startDate, plan.interval);

        const subscription = await prisma.userSubscription.create({
            data: {
                userId: session.user.id,
                planId: plan.id,
                status: SubscriptionStatus.pending,
                startDate,
                endDate,
                nextBillingDate: endDate, // Initial billing date
            },
        });

        // Create initial payment record
        const payment = await prisma.subscriptionPayment.create({
            data: {
                subscriptionId: subscription.id,
                amount: plan.price,
                currency: plan.currency,
                status: 'pending' as any,
                billingStart: startDate,
                billingEnd: endDate,
            },
        });

        // Return subscription data for CloudPayments
        const description = `Подписка ${plan.name}`;

        return NextResponse.json({
            success: true,
            subscriptionId: subscription.id,
            paymentId: payment.id,
            amount: plan.price,
            currency: plan.currency,
            description,
            cloudpaymentsData: {
                publicId: process.env.CLOUD_PAYMENTS_PUBLIC_ID || '',
                invoiceId: subscription.id, // Use subscription ID as invoice ID
                accountId: session.user.id,
            },
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json(
            {
                error: 'Failed to create subscription',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
} 