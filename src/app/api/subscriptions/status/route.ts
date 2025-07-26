import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserActiveSubscription, getUserFeatures } from '@/utils/subscriptions';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's active subscription
        const subscription = await getUserActiveSubscription(session.user.id);
        const features = await getUserFeatures(session.user.id);

        return NextResponse.json({
            success: true,
            hasActiveSubscription: !!subscription,
            subscription,
            features,
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
