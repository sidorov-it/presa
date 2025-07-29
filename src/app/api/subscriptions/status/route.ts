import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let subscription = await prisma.userSubscription.findFirst({
            where: {
                userId: session.user.id,
                status: { in: [SubscriptionStatus.active, SubscriptionStatus.cancelled] },
            },
            include: { subscriptionPlan: true },
            orderBy: { createdAt: 'desc' },
        });

        if (subscription && subscription.endDate < new Date()) {
            subscription = await prisma.userSubscription.update({
                where: { id: subscription.id },
                data: { status: SubscriptionStatus.expired },
                include: { subscriptionPlan: true },
            });
        }

        return NextResponse.json({ success: true, subscription });
    } catch (error) {
        console.error('Error fetching subscription status:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch subscription status',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
