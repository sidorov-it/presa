import { NextRequest, NextResponse } from 'next/server';
import { TestRateLimiterService } from '@/services/llm/test/testRateLimiterService';

const testService = new TestRateLimiterService(2); // Limit to 2 concurrent requests

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { count = 1, delay = 1000, shouldFail = false } = body;

        if (count === 1) {
            const result = await testService.simulateApiCall(delay, shouldFail);
            return NextResponse.json(result);
        }

        const results = await testService.processBatch(count, delay);
        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        // Simple test with a single request
        const result = await testService.simulateApiCall();
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
