import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserSubscriptions } from '@/utils/subscriptions';
import { SubscriptionStatus } from '@prisma/client';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's active subscription
        const subscriptions = await getUserSubscriptions(session.user.id);

        const activeSubscription = subscriptions?.find(
            subscription => subscription.status === SubscriptionStatus.active
        );

        let lastActiveSubscription;

        if (activeSubscription) {
            lastActiveSubscription = activeSubscription;
        } else {
            lastActiveSubscription = subscriptions
                ?.filter(
                    sub =>
                        sub.status === SubscriptionStatus.active ||
                        sub.status === SubscriptionStatus.expired ||
                        sub.status === SubscriptionStatus.cancelled
                )
                .sort((a, b) => {
                    return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
                })[0];
        }

        const nextSubscription = subscriptions?.find(
            subscription => subscription.status === SubscriptionStatus.scheduled
        );

        return NextResponse.json({
            success: true,
            activeSubscription,
            lastActiveSubscription,
            nextSubscription,
            // features,
        });
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
