import { NextRequest, NextResponse } from 'next/server';
import generateTopics from '@/services/llm/generateTopics';
import { generateId } from '@/utils/id';
import { SupportedLLMProvider } from '@/types/llm';

const DEFAULT_USER_ID = '687296818352d4f203efdf5f';

interface ThemesRequestBody {
    provider?: SupportedLLMProvider;
    testScenario?: string;
    requestId?: string;
    userId?: string;
    input?: {
        description?: string;
        numSlides?: number | string;
        tone?: string;
        contentAmount?: string;
        durationMinutes?: number;
        goal?: string;
        audience?: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as ThemesRequestBody;
        const { provider, testScenario, requestId: incomingRequestId, userId, input } = body;

        if (!input?.description) {
            return NextResponse.json({ error: 'Поле description обязательно' }, { status: 400 });
        }

        const numSlides = Number(input.numSlides ?? 10);
        if (Number.isNaN(numSlides) || numSlides <= 0) {
            return NextResponse.json({ error: 'numSlides должно быть положительным числом' }, { status: 400 });
        }

        const tone = input.tone?.trim() || 'neutral';
        const resolvedRequestId = incomingRequestId || generateId();
        const resolvedUserId = userId || DEFAULT_USER_ID;
        const resolvedProvider = (provider || (process.env.LLM_PROVIDER as SupportedLLMProvider)) ?? 'gigachat';

        const result = await generateTopics(
            resolvedUserId,
            {
                description: input.description,
                numSlides,
                tone,
                contentAmount: input.contentAmount,
                durationMinutes: input.durationMinutes,
                goal: input.goal,
                audience: input.audience,
            },
            resolvedRequestId,
            { provider, testScenario }
        );

        return NextResponse.json({
            requestId: resolvedRequestId,
            provider: resolvedProvider,
            testScenario,
            ...result,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
        return NextResponse.json(
            {
                error: `Не удалось сгенерировать темы: ${message}`,
            },
            { status: 500 }
        );
    }
}
