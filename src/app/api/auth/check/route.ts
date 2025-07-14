import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function GETHandler() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({
                authenticated: false,
                message: 'Not authenticated',
            });
        }

        return NextResponse.json({
            authenticated: true,
            user: {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                role: session.user.role,
            },
        });
    } catch (error) {
        logger.error('Authentication check error:', error);
        return NextResponse.json(
            {
                authenticated: false,
                message: 'Error checking authentication',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
export const GET = withLogging(GETHandler);
