import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserTokenTransactions } from '@/utils/tokens';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        const transactions = await getUserTokenTransactions(session.user.id, limit);

        return NextResponse.json({
            transactions,
        });
    } catch (error) {
        logger.error('Error getting token transactions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
