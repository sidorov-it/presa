import { NextRequest, NextResponse } from 'next/server';
import generateSlidesTemplates from '@/services/llm/generateSlidesTemplates';
import { generateId } from '@/utils/id';
import { SupportedLLMProvider } from '@/types/llm';

const DEFAULT_USER_ID = '687296818352d4f203efdf5f';

interface TemplatesRequestBody {
    provider?: SupportedLLMProvider;
    testScenario?: string;
    requestId?: string;
    userId?: string;
    payload?: {
        title?: string;
        prompt?: string;
        topics?: unknown;
        contentAmount?: string;
        durationMinutes?: number;
        goal?: string;
        audience?: string;
        tone?: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as TemplatesRequestBody;
        const { provider, testScenario, requestId: incomingRequestId, userId, payload } = body;

        if (!payload?.title || !payload?.prompt) {
            return NextResponse.json(
                { error: 'Поля title и prompt обязательны для подбора шаблонов' },
                { status: 400 }
            );
        }

        let topics = payload.topics;
        if (typeof topics === 'string') {
            try {
                topics = JSON.parse(topics);
            } catch {
                return NextResponse.json(
                    { error: 'topics должен быть массивом объектов или корректной JSON-строкой' },
                    { status: 400 }
                );
            }
        }

        if (!Array.isArray(topics) || topics.length === 0) {
            return NextResponse.json({ error: 'topics должен содержать хотя бы один элемент' }, { status: 400 });
        }

        const resolvedRequestId = incomingRequestId || generateId();
        const resolvedUserId = userId || DEFAULT_USER_ID;
        const resolvedProvider = (provider || (process.env.LLM_PROVIDER as SupportedLLMProvider)) ?? 'gigachat';

        const selections = await generateSlidesTemplates({
            title: payload.title,
            prompt: payload.prompt,
            topics: topics as Array<{ title: string; instructions: string }>,
            contentAmount: payload.contentAmount,
            durationMinutes: payload.durationMinutes,
            goal: payload.goal,
            audience: payload.audience,
            tone: payload.tone || 'neutral',
            options: {
                userId: resolvedUserId,
                requestId: resolvedRequestId,
                provider,
                testScenario,
            },
        });

        return NextResponse.json({
            requestId: resolvedRequestId,
            provider: resolvedProvider,
            testScenario,
            templateSelections: selections,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
        return NextResponse.json(
            {
                error: `Не удалось подобрать шаблоны: ${message}`,
            },
            { status: 500 }
        );
    }
}
