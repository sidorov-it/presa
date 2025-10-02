import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function up() {
    console.log('Adding headerFooterConfig field to presentations...');

    try {
        // Установить поле headerFooterConfig в null, если его нет
        const result = await prisma.presentation.updateMany({
            where: {
                headerFooterConfig: null,
            },
            data: {
                headerFooterConfig: null,
            },
        });

        console.log(`Updated ${result.count} presentations with headerFooterConfig=null`);
    } catch (error) {
        console.error('Error updating presentations:', error);
        throw error;
    }
}

export async function down() {
    console.log('Removing headerFooterConfig field from presentations...');

    try {
        // Удалить поле headerFooterConfig (MongoDB: set to null)
        const result = await prisma.presentation.updateMany({
            where: {},
            data: {
                headerFooterConfig: null,
            },
        });

        console.log(`Removed headerFooterConfig from ${result.count} presentations`);
    } catch (error) {
        console.error('Error removing headerFooterConfig from presentations:', error);
        throw error;
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    up()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Migration failed:', error);
            process.exit(1);
        })
        .finally(() => {
            prisma.$disconnect();
        });
}
