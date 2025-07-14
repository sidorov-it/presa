import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { addTokens, getTokenPackages } from '@/utils/tokens';
import { TransactionType } from '@prisma/client';

async function POSTHandler(request: NextRequest) {
    try {
        // Проверяем авторизацию
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { packageId } = await request.json();

        if (!packageId) {
            return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
        }

        // Получаем информацию о пакете
        const packages = await getTokenPackages();
        const selectedPackage = packages.find(pkg => pkg.id === packageId);

        if (!selectedPackage) {
            return NextResponse.json({ error: 'Package not found' }, { status: 404 });
        }

        // Имитируем успешную покупку
        // В реальном приложении здесь была бы интеграция с платежной системой
        const purchaseId = `test_${Date.now()}`;

        // Добавляем токены пользователю
        await addTokens(
            session.user.id,
            selectedPackage.tokens,
            TransactionType.purchase,
            `Тестовая покупка пакета "${selectedPackage.name}"`,
            purchaseId,
            {
                packageId,
                packageName: selectedPackage.name,
                testPurchase: true,
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Покупка успешно завершена',
            purchaseId,
            tokensAdded: selectedPackage.tokens,
        });
    } catch (error) {
        logger.error('Error processing token purchase:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export const POST = withLogging(POSTHandler);
