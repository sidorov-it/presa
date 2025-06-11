/* eslint-disable prettier/prettier */
/* eslint-disable indent */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getYooKassaService } from '@/services/payments/yookassa';

interface RouteParams {
    params: {
        purchaseId: string;
    };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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
                userId: session.user.id, // Проверяем, что покупка принадлежит текущему пользователю
            },
            include: {
                package: true,
            },
        });

        if (!purchase) {
            return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
        }

        // Если есть paymentId, получаем актуальную информацию о платеже из YooKassa
        let paymentInfo = null;
        if (purchase.paymentId) {
            try {
                const yooKassaService = getYooKassaService();
                paymentInfo = await yooKassaService.getPayment(purchase.paymentId);

                // Обновляем статус в БД, если он изменился
                if (paymentInfo.status !== (purchase.metadata as any)?.yookassaStatus) {
                    await prisma.tokenPurchase.update({
                        where: { id: purchase.id },
                        data: {
                            metadata: {
                                ...((purchase.metadata as any) || {}),
                                yookassaStatus: paymentInfo.status,
                                lastChecked: new Date().toISOString(),
                            },
                        },
                    });
                }
            } catch (error) {
                console.error('Error fetching payment info from YooKassa:', error);
                // Не блокируем ответ, если не удалось получить данные из YooKassa
            }
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
            },
            payment: paymentInfo ?
                {
                    id: paymentInfo.id,
                    status: paymentInfo.status,
                    amount: paymentInfo.amount,
                    createdAt: paymentInfo.created_at,
                    confirmationUrl: paymentInfo.confirmation?.confirmation_url,
                }
                : null,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error checking purchase status:', error);
        return NextResponse.json(
            {
                error: 'Failed to check purchase status',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
