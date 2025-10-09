import { NextRequest, NextResponse } from 'next/server';
import generateSlideContent from '@/services/llm/generateSlideContent';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { generateId } from '@/utils/id';
import { SupportedLLMProvider } from '@/types/llm';

const DEFAULT_USER_ID = '687296818352d4f203efdf5f';

interface ContentRequestBody {
    provider?: SupportedLLMProvider;
    testScenario?: string;
    requestId?: string;
    userId?: string;
    payload?: {
        templateId?: string;
        topic?: string;
        instructions?: string;
        slideIndex?: number;
        totalSlides?: number;
        contentAmount?: string;
        durationMinutes?: number;
        goal?: string;
        audience?: string;
        tone?: string;
        previousSlides?: Array<{ title?: string; content: string }> | string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as ContentRequestBody;
        const { provider, testScenario, requestId: incomingRequestId, userId, payload } = body;

        if (!payload?.templateId) {
            return NextResponse.json({ error: 'templateId обязателен' }, { status: 400 });
        }

        if (!payload.topic) {
            return NextResponse.json({ error: 'topic обязателен' }, { status: 400 });
        }

        const template = SlideTemplatesRegistry[payload.templateId];
        if (!template) {
            return NextResponse.json(
                { error: `Шаблон ${payload.templateId} не найден в SlideTemplatesRegistry` },
                { status: 404 }
            );
        }

        let previousSlides = payload.previousSlides;
        if (typeof previousSlides === 'string') {
            try {
                previousSlides = JSON.parse(previousSlides);
            } catch {
                return NextResponse.json(
                    { error: 'previousSlides должен быть массивом или корректной JSON-строкой' },
                    { status: 400 }
                );
            }
        }

        const resolvedRequestId = incomingRequestId || generateId();
        const resolvedUserId = userId || DEFAULT_USER_ID;
        const resolvedProvider = (provider || (process.env.LLM_PROVIDER as SupportedLLMProvider)) ?? 'gigachat';

        const { functionArgs, slotMapping } = await generateSlideContent({
            topic: payload.topic,
            slideIndex: payload.slideIndex ?? 0,
            totalSlides: payload.totalSlides ?? 1,
            template,
            instructions: payload.instructions,
            contentAmount: payload.contentAmount,
            durationMinutes: payload.durationMinutes,
            goal: payload.goal,
            audience: payload.audience,
            tone: payload.tone || 'neutral',
            previousSlides: previousSlides as Array<{ title?: string; content: string }> | undefined,
            options: {
                userId: resolvedUserId,
                requestId: resolvedRequestId,
                provider,
                testScenario,
            },
        });

        const serializedSlotMapping = Array.from(slotMapping.entries()).map(([slotKey, mapping]) => ({
            slotKey,
            mapping,
        }));

        return NextResponse.json({
            requestId: resolvedRequestId,
            provider: resolvedProvider,
            testScenario,
            functionArgs,
            slotMapping: serializedSlotMapping,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
        return NextResponse.json(
            {
                error: `Не удалось сгенерировать контент: ${message}`,
            },
            { status: 500 }
        );
    }
}
