import { NextResponse } from 'next/server';
import { LLMHistoryService } from '@/services/llm/history/llmHistoryService';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const [history, stats] = await Promise.all([
        LLMHistoryService.getAllHistory({ limit, offset }),
        LLMHistoryService.getGlobalStats(),
    ]);

    return NextResponse.json({ history, stats });
}
