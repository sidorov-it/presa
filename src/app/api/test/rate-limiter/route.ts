import { withLogging } from '@/hooks/withLoging';
import { NextRequest, NextResponse } from 'next/server';
import { TestRateLimiterService } from '@/services/llm/test/testRateLimiterService';
import logger from '@/utils/logger';

const testService = new TestRateLimiterService(2); // Limit to 2 concurrent requests

async function POSTHandler(request: NextRequest) {
    try {
        logger.info('POST /api/test/rate-limiter');
        const body = await request.json();
        const { count = 1, delay = 1000, shouldFail = false } = body;

        if (count === 1) {
            const result = await testService.simulateApiCall(delay, shouldFail);
            return NextResponse.json(result);
        }

        const results = await testService.processBatch(count, delay);
        return NextResponse.json(results);
    } catch (error) {
        logger.error(`Rate limiter test POST failed: ${String(error)}`);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

async function GETHandler() {
    try {
        logger.info('GET /api/test/rate-limiter');
        // Simple test with a single request
        const result = await testService.simulateApiCall();
        return NextResponse.json(result);
    } catch (error) {
        logger.error(`Rate limiter test GET failed: ${String(error)}`);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
export const GET = withLogging(GETHandler);
export const POST = withLogging(POSTHandler);
