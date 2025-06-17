import { PrismaClient } from '@prisma/client';
import { THEME_TEMPLATES } from '../src/themes/themeTemplates';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding token packages...');

    // Проверяем, есть ли уже пакеты
    const existingPackages = await prisma.tokenPackage.count();

    if (existingPackages > 0) {
        console.log('Token packages already exist, skipping seed...');
    }

    // Создаем тестовые пакеты токенов
    const packages = await prisma.tokenPackage.createMany({
        data: [
            {
                name: 'Базовый',
                description: 'Идеально для начала работы',
                tokens: 1000,
                price: 100,
                currency: 'RUB',
                isActive: true,
                isPopular: false,
            },
            {
                name: 'Продвинутый',
                description: 'Для активных пользователей',
                tokens: 3000,
                price: 250,
                currency: 'RUB',
                isActive: true,
                isPopular: true,
            },
            {
                name: 'Профессиональный',
                description: 'Максимум возможностей',
                tokens: 10000,
                price: 750,
                currency: 'RUB',
                isActive: true,
                isPopular: false,
            },
            {
                name: 'Корпоративный',
                description: 'Для больших команд',
                tokens: 25000,
                price: 1500,
                currency: 'RUB',
                isActive: true,
                isPopular: false,
            },
        ],
    });

    console.log(`Created ${packages.count} token packages`);

    console.log('Seeding default themes...');
    const existingThemes = await prisma.theme.count();
    if (existingThemes === 0) {
        for (const theme of THEME_TEMPLATES) {
            console.log('Creating theme', theme);
            await prisma.theme.create({
                data: theme,
            });
        }
        console.log(`Created ${THEME_TEMPLATES.length} themes`);
    } else {
        console.log('Themes already exist, skipping');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });