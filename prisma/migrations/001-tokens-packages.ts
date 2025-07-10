import { Db } from 'mongodb';

export async function up(db: Db) {
    await db.collection('TokenPackage').insertMany([
        {
            name: 'Базовый',
            description: 'Идеально для начала работы',
            tokens: 200,
            price: 400,
            currency: 'RUB',
            isActive: true,
            isPopular: false,
        },
        {
            name: 'Продвинутый',
            description: 'Для активных пользователей',
            tokens: 400,
            price: 750,
            currency: 'RUB',
            isActive: true,
            isPopular: true,
        },
        {
            name: 'Профессиональный',
            description: 'Максимум возможностей',
            tokens: 600,
            price: 1000,
            currency: 'RUB',
            isActive: true,
            isPopular: false,
        },
        // {
        //     name: 'Корпоративный',
        //     description: 'Для больших команд',
        //     tokens: 25000,
        //     price: 1500,
        //     currency: 'RUB',
        //     isActive: true,
        //     isPopular: false,
        // },
    ]);
    // await db.collection('TokenPackage').updateMany({}, { $set: { tokens: 200 } });
}
