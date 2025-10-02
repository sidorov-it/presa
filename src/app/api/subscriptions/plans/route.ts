import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch active subscription plans
        const plans = await prisma.subscriptionPlan.findMany({
            where: {
                isActive: true,
            },
            orderBy: [
                { isPopular: 'desc' }, // Popular plans first
                { price: 'asc' }, // Then by price
            ],
        });

        return NextResponse.json({
            success: true,
            plans,
        });
    } catch (error) {
        console.error('Error fetching subscription plans:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            {
                error: 'Failed to fetch subscription plans',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
