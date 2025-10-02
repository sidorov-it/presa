import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function up() {
    console.log('Adding contentAmount field to presentations...');

    try {
        // Update all existing presentations to have the default contentAmount value
        const result = await prisma.presentation.updateMany({
            where: {
                contentAmount: null,
            },
            data: {
                contentAmount: 'medium',
            },
        });

        console.log(`Updated ${result.count} presentations with default contentAmount value`);
    } catch (error) {
        console.error('Error updating presentations:', error);
        throw error;
    }
}

export async function down() {
    console.log('Removing contentAmount field from presentations...');

    try {
        // Remove contentAmount field by setting it to null
        const result = await prisma.presentation.updateMany({
            where: {},
            data: {
                contentAmount: null,
            },
        });

        console.log(`Removed contentAmount from ${result.count} presentations`);
    } catch (error) {
        console.error('Error removing contentAmount from presentations:', error);
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
