import { SlideTemplateCore, TemplateElement } from '@/types/templates';
import { GigaChatService } from './gigaChat';
import { ElementType } from '@/types/elements';
import { TextType } from '@/types';
import getRandomString from '@/utils/getRandomString';
import { LLMRequestContext, SlotKeyMapping } from '@/types/gigachat';

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

        elementsByCell.forEach(elements => {
            elements.forEach((element, elementIndex) => {
                if (element.elementTypeId === ElementType.SMART_LAYOUT) {
                    const smartLayoutKey = getRandomString(10);

                    const items = element.props.items
                        ?.flatMap((item, index) => {
                            return Object.keys(item).flatMap(key => {
                                if (!element.llmHints?.items?.[key]) {
                                    return;
                                }

                                const uniqueKey = getRandomString(10);
                                return {
                                    originalKey: key,
                                    key: uniqueKey,
                                    itemIndex: index,
                                    type: element.llmHints?.items?.[key]?.type,
                                    description: element.llmHints?.items?.[key]?.description,
                                };
                            });
                        })
                        .filter(Boolean);

                    mapping.set(smartLayoutKey, {
                        uniqueKey: smartLayoutKey,
                        layoutIndex,
                        elementIndex,
                        column: element.column,
                        llmHints: element.llmHints,
                        items,
                    });
                } else if (
                    [TextType.BULLET_LIST, TextType.NUMERED_LIST, TextType.TODO_LIST].includes(element.props?.textType)
                ) {
                    let uniqueKey = element.slot;
                    if (usedSlots.has(element.slot)) {
                        uniqueKey = `${element.slot}-${layoutIndex}-${elementIndex}-${element.column}`;
                    }
                    usedSlots.add(element.slot);

                    mapping.set(uniqueKey, {
                        uniqueKey,
                        layoutIndex,
                        elementIndex,
                        column: element.column,
                        originalSlot: element.slot,
                        llmHints: element.llmHints,
                        textType: element.props?.textType,
                    });
                } else if (!element.slot) {
                    return;
                } else {
                    let uniqueKey = element.slot;
                    if (usedSlots.has(element.slot)) {
                        uniqueKey = `${element.slot}-${layoutIndex}-${elementIndex}-${element.column}`;
                    }
                    usedSlots.add(element.slot);

                    mapping.set(uniqueKey, {
                        uniqueKey,
                        layoutIndex,
                        elementIndex,
                        column: element.column,
                        originalSlot: element.slot,
                        llmHints: element.llmHints,
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

function createPromptGenerateSlideContent(
    topic: string,
    slideIndex: number,
    totalSlides: number,
    template: SlideTemplateCore,
    slotsMapping: Map<string, SlotKeyMapping>,
    instructions?: string
): string {
    const slotsDescription = generateSlotDescription(template, slotsMapping);

    return `Создай структурированный контент для слайда ${slideIndex} из ${totalSlides} о теме: "${topic}"

Структура слайда:
${slotsDescription}

Требования:
1. Создай контент для каждого слота в соответствии с его типом и назначением
2. Для элементов типа image опиши, какое изображение нужно сгенерировать
3. Учитывай назначение и правила для каждого слота
${instructions ? `4. Дополнительные инструкции: ${instructions}` : ''}`;
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
    options,
}: {
    topic: string;
    slideIndex: number;
    totalSlides: number;
    template: SlideTemplateCore;
    instructions?: string;
    options: LLMRequestContext;
}) {
    const gigaChatService = GigaChatService.createGigaChatService({ userId: options.userId });

    const { functionSchema, slotMapping } = createGenerateSlideContentFunction(template);

    const prompt = createPromptGenerateSlideContent(
        topic,
        slideIndex,
        totalSlides,
        template,
        slotMapping,
        instructions
    );
    console.log(prompt);

    // получаем ответ от LLM
    // const response = await gigaChatService.generateFromCache(topic);
    const response = await gigaChatService.generate(prompt, {
        functions: [functionSchema],
        function_call: { name: 'generate_slide_text' },
    });

    return {
        functionArgs: response.function_call?.arguments,
        slotMapping,
    };
}
