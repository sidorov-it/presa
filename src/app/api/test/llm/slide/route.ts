import { NextRequest, NextResponse } from 'next/server';
import { SupportedLLMProvider } from '@/types/llm';
import { SlotKeyMapping } from '@/types/gigachat';
import { createSlideFromTemplateWithContent } from '@/utils/createSlideFromTemplateWithContent';
import { generateId } from '@/utils/id';

const DEFAULT_USER_ID = '687296818352d4f203efdf5f';

interface SlotMappingEntry {
    slotKey: string;
    mapping: SlotKeyMapping;
}

interface SlideRequestBody {
    provider?: SupportedLLMProvider;
    testScenario?: string;
    requestId?: string;
    userId?: string;
    payload?: {
        templateId?: string;
        slotMapping?: SlotMappingEntry[] | string;
        functionArgs?: Record<string, unknown> | string;
        title?: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as SlideRequestBody;
        const { provider, testScenario, requestId: incomingRequestId, userId, payload } = body;

        if (!payload?.templateId) {
            return NextResponse.json({ error: 'templateId обязателен' }, { status: 400 });
        }

        let slotMappingPayload = payload.slotMapping;
        if (typeof slotMappingPayload === 'string') {
            try {
                slotMappingPayload = JSON.parse(slotMappingPayload) as SlotMappingEntry[];
            } catch {
                return NextResponse.json(
                    { error: 'slotMapping должен быть массивом или корректной JSON-строкой' },
                    { status: 400 }
                );
            }
        }

        if (!Array.isArray(slotMappingPayload) || slotMappingPayload.length === 0) {
            return NextResponse.json({ error: 'slotMapping должен содержать хотя бы один элемент' }, { status: 400 });
        }

        const slotMapping = new Map<string, SlotKeyMapping>();
        for (const entry of slotMappingPayload) {
            if (!entry?.slotKey || !entry?.mapping) {
                return NextResponse.json(
                    { error: 'Каждый элемент slotMapping должен содержать slotKey и mapping' },
                    { status: 400 }
                );
            }
            slotMapping.set(entry.slotKey, entry.mapping);
        }

        let layoutsContents = payload.functionArgs;
        if (typeof layoutsContents === 'string') {
            try {
                layoutsContents = JSON.parse(layoutsContents) as Record<string, unknown>;
            } catch {
                return NextResponse.json(
                    { error: 'functionArgs должен быть объектом или корректной JSON-строкой' },
                    { status: 400 }
                );
            }
        }

        if (!layoutsContents || typeof layoutsContents !== 'object') {
            return NextResponse.json(
                { error: 'functionArgs должен быть объектом с данными для слотов' },
                { status: 400 }
            );
        }

        const resolvedRequestId = incomingRequestId || generateId();
        const resolvedUserId = userId || DEFAULT_USER_ID;
        const resolvedProvider = (provider || (process.env.LLM_PROVIDER as SupportedLLMProvider)) ?? 'gigachat';

        const slide = await createSlideFromTemplateWithContent({
            templateId: payload.templateId,
            slotMapping,
            layoutsContents: layoutsContents as Record<string, string | string[] | Record<string, unknown>>,
            title: payload.title || 'Черновой слайд',
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
            slide,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
        return NextResponse.json(
            {
                error: `Не удалось собрать слайд: ${message}`,
            },
            { status: 500 }
        );
    }
}
