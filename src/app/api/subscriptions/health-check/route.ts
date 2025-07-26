import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { performSubscriptionHealthCheck } from '@/utils/subscriptions';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Perform subscription health check
        await performSubscriptionHealthCheck(session.user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Subscription health check API error:', error);
        
        // Don't return error to client - this is a background operation
        return NextResponse.json({ success: true });
    }
} 