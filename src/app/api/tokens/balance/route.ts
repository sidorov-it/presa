import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserTokenBalance, ensureUserTokensRecord } from '@/utils/tokens';

export async function GET(_request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user has a tokens record
        await ensureUserTokensRecord(session.user.id);

        // Get current balance
        const balance = await getUserTokenBalance(session.user.id);

        return NextResponse.json({
            balance,
            userId: session.user.id,
        });
    } catch (error) {
        logger.error('Error getting token balance:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
