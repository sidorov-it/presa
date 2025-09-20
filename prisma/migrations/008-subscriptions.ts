import { Db } from 'mongodb';

export async function up(db: Db) {
    console.log('Creating subscription system enums...');

    await db.collection('SubscriptionPlan').insertMany([
        {
            name: 'Месячная подписка',
            description: 'Полный доступ ко всем функциям на месяц',
            interval: 'monthly',
            price: 199,
            currency: 'RUB',
            isActive: true,
            isPopular: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            features: {
                maxSlides: 20,
                hideBranding: true,
                maxDocumentSize: 10,
                priority: true,
                customExport: true,
            },
        },
        {
            name: 'Подписка на 3 месяца',
            description: 'Лучший выбор для регулярного использования',
            interval: 'quarterly',
            price: 540,
            currency: 'RUB',
            isActive: true,
            isPopular: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            features: {
                maxSlides: 20,
                hideBranding: true,
                maxDocumentSize: 10,
                priority: true,
                customExport: true,
            },
        },
        {
            name: 'Подписка на 6 месяцев',
            description: 'Максимальная экономия для профессионалов',
            interval: 'semiannual',
            price: 950,
            currency: 'RUB',
            isActive: true,
            isPopular: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            features: {
                maxSlides: 20,
                hideBranding: true,
                maxDocumentSize: 10,
                priority: true,
                customExport: true,
            },
        },
    ]);
}
