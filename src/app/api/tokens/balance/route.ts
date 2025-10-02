import { withLogging } from '@/hooks/withLoging';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserTokenBalance, ensureUserTokensRecord } from '@/utils/tokens';
import { handleApiError } from '@/utils/errorHandler';

async function GETHandler(_request: NextRequest) {
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
        return handleApiError(error, 'Token balance retrieval', 'GET /api/tokens/balance');
    }
}
export const GET = withLogging(GETHandler);
