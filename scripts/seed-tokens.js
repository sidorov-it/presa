const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTokenPackages() {
    try {
        console.log('Seeding token packages...');

        // Clear existing packages
        await prisma.tokenPackage.deleteMany({});

        // Create token packages
        const packages = [
            {
                name: 'Starter Pack',
                description: 'Идеально для начинающих',
                tokens: 1000,
                price: 9.99,
                currency: 'USD',
                isActive: true,
                isPopular: false,
            },
            {
                name: 'Professional Pack',
                description: 'Лучший выбор для профессионалов',
                tokens: 5000,
                price: 39.99,
                currency: 'USD',
                isActive: true,
                isPopular: true,
            },
            {
                name: 'Enterprise Pack',
                description: 'Максимум возможностей',
                tokens: 15000,
                price: 99.99,
                currency: 'USD',
                isActive: true,
                isPopular: false,
            },
            {
                name: 'Mini Pack',
                description: 'Попробуйте наши возможности',
                tokens: 250,
                price: 2.99,
                currency: 'USD',
                isActive: true,
                isPopular: false,
            },
        ];

        for (const packageData of packages) {
            await prisma.tokenPackage.create({
                data: packageData,
            });
            console.log(`Created package: ${packageData.name}`);
        }

        console.log('Token packages seeded successfully!');

        // Optionally, give existing users some free tokens
        const users = await prisma.user.findMany();
        console.log(`Found ${users.length} users, giving them 100 free tokens...`);

        for (const user of users) {
            // Check if user already has tokens record
            const existingTokens = await prisma.userTokens.findUnique({
                where: { userId: user.id },
            });

            if (!existingTokens) {
                await prisma.userTokens.create({
                    data: {
                        userId: user.id,
                        balance: 100, // Free tokens for existing users
                        totalUsed: 0,
                    },
                });

                // Create transaction record for the free tokens
                await prisma.tokenTransaction.create({
                    data: {
                        userId: user.id,
                        amount: 100,
                        type: 'bonus',
                        description: 'Welcome bonus tokens',
                        balanceBefore: 0,
                        balanceAfter: 100,
                    },
                });

                console.log(`Gave 100 free tokens to user: ${user.email}`);
            }
        }

        console.log('Database seeding completed!');
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed function
seedTokenPackages().catch(error => {
    console.error(error);
    process.exit(1);
});
