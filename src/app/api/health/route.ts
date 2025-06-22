import { NextResponse } from 'next/server';
import logger from '@/utils/logger';

export async function GET() {
    try {
        // Проверяем подключение к базе данных
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        await prisma.$connect();
        await prisma.$disconnect();

        logger.info('Health check passed');
        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        });
    } catch (error) {
        logger.error(`Health check failed: ${String(error)}`);

        return NextResponse.json(
            {
                status: 'error',
                timestamp: new Date().toISOString(),
                error: 'Database connection failed',
            },
            { status: 503 }
        );
    }
}
