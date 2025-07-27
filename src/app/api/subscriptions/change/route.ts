import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ChangeSubscriptionRequest, ChangeSubscriptionResponse } from '@/types/subscriptions';
import { changeSubscriptionPlan } from '@/utils/subscriptions';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: ChangeSubscriptionRequest = await request.json();
        const { newPlanId, startImmediately = false } = body;

        if (!newPlanId) {
            return NextResponse.json({ error: 'New plan ID is required' }, { status: 400 });
        }

        const result = await changeSubscriptionPlan(session.user.id, newPlanId, startImmediately);

        if (result.success) {
            const response: ChangeSubscriptionResponse = {
                success: true,
                subscriptionId: result.subscriptionId,
                message: startImmediately
                    ? 'План подписки изменен немедленно'
                    : 'Изменение плана подписки запланировано на конец текущего периода',
            };
            return NextResponse.json(response);
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Failed to change subscription plan',
                },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error changing subscription plan:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 }
        );
    }
}
