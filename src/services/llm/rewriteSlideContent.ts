import { TemplateElement } from '@/types/templates';
import { Slide, TextType } from '@/types';
import createRewriteSlideMapping from '@/utils/createRewriteSlideMapping';
import { createLLMService } from '@/services/llm';

export interface SlotContent {
    key: string;
    value: {
        type: 'string' | 'smart-layout';
        stringContent?: string;
        items?: Array<Record<string, string>>;
    };
}

export interface SmartLayoutContent {
    items: Array<Record<string, string>>;
}

export interface SlotKeyMapping {
    elementId: string;
    uniqueKey: string;
    originalSlot: string;
    llmHints?: TemplateElement['llmHints'];
    items?: Array<Record<string, TemplateElement['llmHints']>>;
    textType?: TextType;
    layoutId: string;
    itemIndex?: number;
    content: string;
}

interface RewriteSlotItem { key: string; type?: string; description?: string; contextRules?: string[]; originalKey?: string; }

function createRewriteSlideContentFunction(slide: Slide) {
    const slotMapping = createRewriteSlideMapping(slide)!;

    const properties: any = {};

    for (const [key, value] of slotMapping.entries()) {
        if (value.items && value.items.length > 0) {
            const entryProperties: any = {};
            const required: string[] = [];

            (value.items as RewriteSlotItem[]).forEach(item => {
                required.push(item.key);

                entryProperties[item.key] = {
                    type: item.type ?? 'string',
                    description: item.description,
                    contextRules: item.contextRules,
                };
            });

            properties[key] = {
                type: 'object',
                description: value.llmHints?.purpose,
                properties: entryProperties,
                required,
            };
        } else if (value.textType && [TextType.BULLET_LIST, TextType.NUMERED_LIST, TextType.TODO_LIST].includes(value.textType)) {
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
            };
        }
    }

    return {
        slotMapping,
        functionSchema: {
            name: 'rewrite_slide_text',
            description: 'Переписать слайд с учетом контекста',
            parameters: {
                type: 'object',
                properties,
                required: Object.keys(properties),
            },
        },
    };
}

const generateSlotDescription = (slotMapping: Map<string, SlotKeyMapping>): string => {
    return Array.from(slotMapping.values())
        .map(slot => {
            if (slot.items && slot.items.length > 0) {
                return slot.items
                    .map(item => {
                        return `Слот "${item.key}":
  - Тип: ${item.type}
  - Назначение: ${item.description || 'Не указано'}
  ${item.contextRules ? `  - Правила:
${item.contextRules.map(r => `    * ${r}`).join('\n')}` : ''}`;
                    })
                    .join('\n');
            }

            return `Слот "${slot.uniqueKey}":
  - Назначение: ${slot.llmHints?.purpose || 'Не указано'}
  ${slot.llmHints?.contextRules ? `- Правила:
${slot.llmHints?.contextRules.map(r => `  * ${r}`).join('\n')}` : ''}`;
        })
        .join('\n\n');
};

const createPromptRewriteSlideContent = (
    slotMapping: Map<string, SlotKeyMapping>,
    instructions?: string
) => {
    const slotsDescription = generateSlotDescription(slotMapping);
    const currentContent = Array.from(slotMapping.entries())
        .map(([key, value]) => `${key}: ${value.content}`)
        .join('\n');

    return `Перепиши контент слайда, соблюдая структуру и приблизительную длину текстов. Формат для ВСЕХ текстовых полей — Markdown (без HTML).

Описание слотов:
${slotsDescription}

Текущий контент слотов:
${currentContent}

Требования:
1. Перепиши контент для КАЖДОГО слота, учитывая тип, назначение и правила.
2. Не изменяй структуру, порядок и количество слотов.
3. Сохрани приблизительную длину оригинального текста (±20%).
4. Соблюдай Markdown-форматирование:
   • Заголовки: #, ##, ###
   • Списки: -, 1. 2. 3.
   • Цитаты: >
5. Для списков сохраните количество пунктов.
${instructions ? `Дополнительные инструкции: ${instructions}` : ''}`;
};

export default async function rewriteSlideContent(
    userId: string,
    slide: Slide,
    instructions?: string
) {
    try {
        const llmService = createLLMService({ userId });

        const { functionSchema, slotMapping } = createRewriteSlideContentFunction(slide);

        const prompt = createPromptRewriteSlideContent(slotMapping!, instructions);
        console.log(prompt);

        // получаем ответ от LLM
        // const response = await gigaChatService.generateFromCache(topic);
        const response = await llmService.generate(prompt, {
            functions: [functionSchema],
            function_call: { name: 'rewrite_slide_text' },
        });

        // const updatedSlide: Slide = cloneDeep(slide);

        // if (response.function_call?.arguments) {
        //     Object.entries(response.function_call.arguments).forEach(([key, value]) => {
        //         const slot = slotMapping?.get(key);
        //         const originElement = slide.layouts
        //             .find(layout => layout.id === slot?.layoutId)
        //             ?.elements.find(element => element.id === slot?.elementId);

        //         if (slot && originElement) {
        //             updatedSlide.layouts = updatedSlide.layouts.map(layout => {
        //                 if (layout.id === slot.layoutId) {
        //                     return {
        //                         ...layout,
        //                         elements: layout.elements.map(element => {
        //                             if (element.id === slot.elementId) {
        //                                 if (element.elementTypeId === ElementType.SMART_LAYOUT) {
        //                                     return {
        //                                         ...element,
        //                                         items: element.items.map((item, index) => {
        //                                             if (value.itemIndex === index) {
        //                                                 return {
        //                                                     ...item,
        //                                                     [slot.originalSlot]: value,
        //                                                 };
        //                                             }
        //                                             return item;
        //                                         }),
        //                                     };
        //                                 } else if (element.elementTypeId === ElementType.TEXT) {
        //                                     return {
        //                                         ...element,
        //                                         [slot.originalSlot]: getTextContent(
        //                                             (originElement as EditorElement).textType as TextType,
        //                                             value as string
        //                                         ),
        //                                     };
        //                                 } else {
        //                                     return {
        //                                         ...element,
        //                                         [slot.originalSlot]: value,
        //                                         // props: { ...element.props, [slot.originalSlot]: value },
        //                                     };
        //                                 }
        //                             }

        //                             return element;
        //                         }),
        //                     };
        //                 }
        //                 return layout;
        //             });
        //         }
        //     });
        // } else {
        //     throw new Error('No function call arguments');
        // }
        // console.log(response);

        // const updatedResponse = { ...response.function_call?.arguments };

        // Object.keys(updatedResponse).forEach(key => {
        //     updatedResponse[key] = `${getRandomString(5)} ${updatedResponse[key]}`;
        // });

        // return updatedResponse;
        return response.function_call?.arguments;
    } catch (error) {
        console.error(error);
    }
}
