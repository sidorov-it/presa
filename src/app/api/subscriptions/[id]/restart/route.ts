import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: subscriptionId } = await params;

        const subscription = await prisma.userSubscription.findFirst({
            where: {
                id: subscriptionId,
                userId: session.user.id,
                OR: [{ status: SubscriptionStatus.cancelled }, { status: SubscriptionStatus.expired }],
            },
        });

        if (!subscription) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        // https://api.cloudpayments.ru/subscriptions/cancel

        const authToken = Buffer.from(
            `${process.env.CLOUDPAYMENTS_PUBLIC_ID}:${process.env.CLOUDPAYMENTS_SECRET_KEY}`
        ).toString('base64');

        const startDate = new Date();

        startDate.setMinutes(startDate.getMinutes() + 1);

        const response = await fetch(`https://api.cloudpayments.ru/subscriptions/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${authToken}`,
            },
            body: JSON.stringify({
                Id: subscription.cloudpaymentsId,
                StartDate: startDate.toUTCString(),
            }),
        });

        const data = await response.json();
        if (data.Success) {
            const model = data.Model;
            // Обновляем только поля, которые есть в модели UserSubscription
            const updatedSubscription = await prisma.userSubscription.update({
                where: { id: subscriptionId },
                data: {
                    status: SubscriptionStatus.active,
                    cancelledAt: null,
                    cancelReason: null,
                    cloudpaymentsId: model.Id,
                    startDate: model.StartDateIso ? new Date(model.StartDateIso) : subscription.startDate,
                    nextBillingDate: model.NextTransactionDateIso
                        ? new Date(model.NextTransactionDateIso)
                        : subscription.nextBillingDate,
                },
            });

            // Логируем возобновление
            console.log(`Subscription ${subscriptionId} restarted by user ${session.user.id}`);

            return NextResponse.json({
                success: true,
                message: 'Subscription restarted successfully',
                subscription: updatedSubscription,
            });
        } else {
            return NextResponse.json({
                success: false,
                message: 'Subscription cancellation failed',
                subscription: data,
            });
        }
    } catch (error) {
        console.error('Error cancelling subscription:', error.message);
        return NextResponse.json(
            {
                error: 'Failed to cancel subscription',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
