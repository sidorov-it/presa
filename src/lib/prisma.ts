import { PrismaClient } from '@prisma/client';

// Configure Prisma client with connection pooling
const prismaClientOptions = {
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
};

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Create Prisma client instance
export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient(prismaClientOptions).$extends({
        result: {
            presentation: {
                slides: {
                    needs: { slides: true },
                    compute(presentation) {
                        if (typeof presentation.slides === 'string') {
                            return JSON.parse(presentation.slides);
                        }
                        return presentation.slides;
                    },
                },
            },
        },
    });

if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    globalForPrisma.prisma = prisma;
}
