/* eslint-disable prettier/prettier */
import { SlideTemplateCore, TemplateElement } from '@/types/templates';
import { createLLMService } from '@/services/llm';
import { ElementType } from '@/types/elements';
import getRandomString from '@/utils/getRandomString';
import { LLMRequestContext, SlotKeyMapping } from '@/types/gigachat';
import logger from '@/utils/logger';

function generateUniqueSlotKeys(template: SlideTemplateCore): Map<string, SlotKeyMapping> {
    const mapping = new Map<string, SlotKeyMapping>();
    const usedSlots = new Set<string>();

    template.layouts.forEach((layout, layoutIndex) => {
        const elementsByCell = layout.elements.reduce(
            (acc, element) => {
                const col = element.column ?? 0;

                if (!acc[col]) {
                    acc[col] = [];
                }

                acc[col].push(element);
                return acc;
            },
            [] as Array<Array<TemplateElement>>
        );

        elementsByCell.forEach((elements, col) => {
            elements.forEach((element) => {
                if (element.elementTypeId === ElementType.SMART_LAYOUT) {
                    const uniqueKey = `slot_${getRandomString(8)}`;

                    const llmHints = element.llmHints || {};

                    const items = element.slots?.map(slot => {
                        const originalKey = slot;
                        const key = `${uniqueKey}_${originalKey}`;
                        const itemSchema = llmHints.items?.[originalKey];
                        return {
                            key,
                            originalKey,
                            type: itemSchema?.type || 'string',
                            description: itemSchema?.description || 'Контент для элемента',
                            contextRules: itemSchema?.contextRules,
                        };
                    });

                    mapping.set(uniqueKey, {
                        uniqueKey,
                        originalSlot: 'items',
                        layoutIndex,
                        items,
                        elementTypeId: element.elementTypeId,
                        llmHints: element.llmHints,
                    });
                } else if (element.slots && element.slots.length > 0) {
                    element.slots.forEach(slot => {
                        let uniqueKey = slot;
                        let counter = 0;

                        while (usedSlots.has(uniqueKey)) {
                            counter++;
                            uniqueKey = `${slot}_${counter}`;
                        }

                        usedSlots.add(uniqueKey);

                        mapping.set(uniqueKey, {
                            uniqueKey,
                            originalSlot: slot,
                            layoutIndex,
                            elementTypeId: element.elementTypeId,
                            textType: element.elementTypeId === ElementType.TEXT ? element.textType : undefined,
                            llmHints: element.llmHints,
                        });
                    });
                }
            });
        });
    });

    return mapping;
}

// function mapGeneratedContentToLayouts(
//     content: GeneratedSlotContent[],
//     slotMapping: Map<string, SlotKeyMapping>
// ): Array<Record<string, string | SmartLayoutContent>> {
//     const result: Array<Record<string, string | SmartLayoutContent>> = [];

//     // Initialize result array with empty objects for each layout
//     for (let i = 0; i < Math.max(...Array.from(slotMapping.values()).map(m => m.layoutIndex)) + 1; i++) {
//         result[i] = {};
//     }

//     content.forEach(item => {
//         const mapping = slotMapping.get(item.key);
//         if (!mapping) return;

//         if (!result[mapping.layoutIndex]) {
//             result[mapping.layoutIndex] = {};
//         }

//         result[mapping.layoutIndex][mapping.originalSlot] =
//             item.value.type === 'string' ? item.value.stringContent! : { items: item.value.items! };
//     });

//     return result;
// }

function createGenerateSlideContentFunction(template: SlideTemplateCore) {
    const slotMapping = generateUniqueSlotKeys(template);

    const properties: any = {};

    for (const entry of slotMapping.entries()) {
        const [key, value] = entry;
        if (value.items) {
            const entryProperties = {};
            const required: string[] = [];

            value.items.forEach(item => {
                required.push(item.key);

                entryProperties[item.key] = {
                    type: item.type,
                    description: item.description,
                    contextRules: item.contextRules,
                };
            });

            properties[key] = {
                type: 'object',
                description: value.llmHints?.purpose,
                // contextRules: value.llmHints?.contextRules,
                properties: entryProperties,
                required,
            };
        } else if (value.textType) {
            // только для списков
            properties[key] = {
                type: 'array',
                description: value.llmHints?.purpose,
                items: {
                    type: 'string',
                    description: value.llmHints?.purpose,
                },
            };
        } else {
            properties[key] = {
                type: 'string',
                description: value.llmHints?.purpose,
                // contextRules: value.llmHints?.contextRules,
            };
        }
    }

    return {
        slotMapping,
        functionSchema: {
            name: 'generate_slide_text',
            description: 'Создать структурированный контент для слайда',
            parameters: {
                type: 'object',
                properties,
                required: Object.keys(properties),
            },
        },
    };
}

function generateSlotDescription(template: SlideTemplateCore, slotsMapping: Map<string, SlotKeyMapping>): string {
    const slots = Array.from(slotsMapping)
        .flatMap(slot => slot)
        .filter(val => typeof val !== 'string');

    const filteredLayouts = template.layouts.filter((layout, index) => {
        return slots.some(slot => slot.layoutIndex === index);
    });

    return (
        filteredLayouts
            // return template.layouts
            .map((layout, layoutIndex) => {
                const layoutSlots = slots.filter(slot => slot.layoutIndex === layoutIndex);

                return (
                    `Layout ${layoutIndex + 1} (${layout.layout}):\n` +
                    layoutSlots
                        .map(slot => {
                            if (slot.items) {
                                return slot.items
                                    .map(item => {
                                        return `    Слот "${item.key}":
        - Тип: ${item.type}
        - Назначение: ${item.description}
        ${slot.llmHints?.items?.[item.originalKey]?.contextRules ? '- Правила:\n' + slot.llmHints?.items?.[item.originalKey]?.contextRules.map(rule => `  * ${rule}`).join('\n') : ''}
        `;
                                    })
                                    .join('\n\n');
                            } else {
                                // - Тип: ${slot.elementTypeId}
                                return `    Слот "${slot.uniqueKey}":
        - Назначение: ${slot.llmHints?.purpose || 'Не указано'}
        ${slot.llmHints?.contextRules ? '- Правила:\n' + slot.llmHints.contextRules.map(rule => `  * ${rule}`).join('\n') : ''}`;
                            }
                        })
                        .join('\n\n')
                );
            })
            .join('\n\n')
    );
}

const getContentAmountGuidance = (contentAmount?: string) => {
    switch (contentAmount) {
        case 'concise':
            return `
**КРАТКИЙ КОНТЕНТ:**
- Минимизируй объем текста на слайде
- Используй только ключевые моменты и основные идеи
- Предпочитай тезисы и короткие фразы
- Избегай длинных объяснений и деталей
- Фокусируйся на самом важном`;
        case 'detailed':
            return `
**ПОДРОБНЫЙ КОНТЕНТ:**
- Создавай развернутые объяснения и описания
- Включай детали, примеры и дополнительную информацию
- Предоставляй контекст и обоснования
- Используй полные предложения и абзацы
- Добавляй поясняющие материалы где это уместно`;
        case 'medium':
        default:
            return `
**СРЕДНИЙ ОБЪЕМ КОНТЕНТА:**
- Баланс между краткостью и детальностью
- Включай основную информацию с умеренным количеством деталей
- Используй структурированные списки и короткие абзацы
- Добавляй контекст там, где это необходимо для понимания`;
    }
};

function createPromptGenerateSlideContent({
    topic,
    slideIndex,
    totalSlides,
    template,
    slotsMapping,
    instructions,
    contentAmount,
    durationMinutes,
    goal,
    audience,
    tone,
    previousSlides,
}: {
    topic: string;
    slideIndex: number;
    totalSlides: number;
    template: SlideTemplateCore;
    slotsMapping: Map<string, SlotKeyMapping>;
    instructions?: string;
    contentAmount?: string;
    durationMinutes?: number;
    goal?: string;
    audience?: string;
    tone?: string;
    previousSlides?: { title?: string; content: string }[];
}): string {
    const slotsDescription = generateSlotDescription(template, slotsMapping);

    const previousSlidesSection =
        previousSlides && previousSlides.length > 0
            ? `Контент предыдущих слайдов:\n${previousSlides
                .map((s, i) => `  ${i + 1}. ${s.title || ''} ${s.content.substring(0, 500)}`)
                .join('\n')}`
            : '';

    return `Создай структурированный контент для слайда ${slideIndex + 1} из ${totalSlides}.\n Инструкция пользователя по требуемому слайду: "${topic}".

${goal ? `Цель презентации: ${goal}\n` : ''}${audience ? `Аудитория: ${audience}\n` : ''}${tone ? `Тон/стиль: ${tone}\n` : ''}${
    Number.isInteger(durationMinutes) ? `Длительность доклада: ${durationMinutes} минут\n` : ''
}${getContentAmountGuidance(contentAmount)}

${previousSlidesSection}

Структура слайда:
${slotsDescription}

Требования:
1. Сгенерируй контент для КАЖДОГО слота, соблюдая тип и назначение.
2. Для слотов image опиши, какое изображение нужно сгенерировать.
3. Соблюдай логическую последовательность и связи с предыдущими слайдами.
4. Формат для текстовых полей — Markdown. Без HTML. Если в правилах указаны сиволы markdown, используй их.
5. Независимо от количества строк (даже для одного слова или заголовка) ВСЕГДА возвращай текст в Markdown-формате.
6. Для заголовков используй символы #, ##, ###.
7. Для списков используй символы -, 1. 2. 3.
8. Для цитат используй символы >
9. **ВАЖНО**: Строго следуй указаниям по объему контента выше.
${instructions ? `10. Дополнительные инструкции: ${instructions}` : ''}

ОБЯЗАТЕЛЬНО ВЫЗОВИ фунцию generate_slide_text!
`;
}

// function parseGeneratedContent(content: Array<Array<SlotContent>>): Array<Record<string, string | SmartLayoutContent>> {
//     return content.map(layoutContent =>
//         layoutContent.reduce(
//             (acc, { key, value }) => {
//                 acc[key] = value.type === 'string' ? value.stringContent! : { items: value.items! };
//                 return acc;
//             },
//             {} as Record<string, string | SmartLayoutContent>
//         )
//     );
// }

export default async function generateSlideContent({
    topic,
    slideIndex,
    totalSlides,
    template,
    instructions,
    contentAmount,
    durationMinutes,
    goal,
    audience,
    tone,
    previousSlides,
    options,
}: {
    topic: string;
    slideIndex: number;
    totalSlides: number;
    template: SlideTemplateCore;
    instructions?: string;
    contentAmount?: string;
    durationMinutes?: number;
    goal?: string;
    audience?: string;
    tone?: string;
    previousSlides?: { title: string; content: string }[];
    options: LLMRequestContext;
}) {
    const llmService = createLLMService({ userId: options.userId });

    const { functionSchema, slotMapping } = createGenerateSlideContentFunction(template);

    const prompt = createPromptGenerateSlideContent({
        topic,
        slideIndex,
        totalSlides,
        template,
        slotsMapping: slotMapping,
        instructions,
        contentAmount,
        durationMinutes,
        goal,
        audience,
        tone,
        previousSlides,
    });
    logger.debug('LLM prompt (generateSlideContent):', prompt);

    // получаем ответ от LLM
    // const response = await gigaChatService.generateFromCache(topic);
    const response = await llmService.generate(prompt, {
        functions: [functionSchema],
        function_call: { name: 'generate_slide_text' },
        ...(options.requestId ? { requestId: options.requestId } : {}),
    });

    logger.debug('LLM response (generateSlideContent):', JSON.stringify(response));

    return {
        functionArgs: response.function_call?.arguments,
        slotMapping,
    };
}

// Explicit exports for testing purposes
export { createGenerateSlideContentFunction, createPromptGenerateSlideContent };
