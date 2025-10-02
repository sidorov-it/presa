import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{
        purchaseId: string;
    }>;
}

async function GETHandler(request: NextRequest, props: RouteParams) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { purchaseId } = params;
        // Находим покупку
        const purchase = await prisma.tokenPurchase.findFirst({
            where: {
                id: purchaseId,
                userId: session.user.id,
            },
            include: {
                package: true,
            },
        });
        if (!purchase) {
            return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
        }
        // Формируем ответ
        const response = {
            purchase: {
                id: purchase.id,
                status: purchase.status,
                tokensAmount: purchase.tokensAmount,
                price: purchase.price,
                currency: purchase.currency,
                createdAt: purchase.purchasedAt,
                completedAt: purchase.completedAt,
                package: {
                    id: purchase.package.id,
                    name: purchase.package.name,
                    description: purchase.package.description,
                    tokens: purchase.package.tokens,
                },
                metadata: purchase.metadata,
            },
        };
        return NextResponse.json(response);
    } catch (error) {
        logger.error('Error checking purchase status:', error);
        return NextResponse.json(
            {
                error: 'Failed to check purchase status',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
export const GET = withLogging(GETHandler);
