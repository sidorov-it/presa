import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { resumeSubscription } from '@/utils/subscriptions';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { subscriptionId, planId } = body; // Optional - if not provided, will use the same plan

        const result = await resumeSubscription(session.user.id, subscriptionId, planId);

        if (result.success) {
            return NextResponse.json({
                success: true,
                subscriptionId: result.subscriptionId,
                message: 'Подписка возобновлена',
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Failed to resume subscription',
                },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error resuming subscription:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 }
        );
    }
}
