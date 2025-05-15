import { TemplateElement } from '@/types/templates';
import { Slide, TextType } from '@/types';
import createRewriteSlideMapping from '@/utils/createRewriteSlideMapping';
import { GigaChatService } from './gigaChat';

if (!process.env.GIGACHAT_API_KEY || !process.env.GIGACHAT_AUTH_KEY || !process.env.GIGACHAT_SCOPE) {
    throw new Error('GIGACHAT_API_KEY, GIGACHAT_AUTH_KEY, and GIGACHAT_SCOPE environment variables are not set');
}

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

function createRewriteSlideContentFunction(slide: Slide) {
    const slotMapping = createRewriteSlideMapping(slide);

    // const slotMapping = generateUniqueSlotKeys(template);

    const properties: any = {};

    for (const entry of slotMapping.entries()) {
        const [key, value] = entry;
        if (value.items) {
            const entryProperties = {};
            const required: string[] = [];

            // TODO
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
        } else if ([TextType.BULLET_LIST, TextType.NUMERED_LIST, TextType.TODO_LIST].includes(value.textType)) {
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

const createPromptRewriteSlideContent = (slotMapping: Map<string, SlotKeyMapping>) => {
    return `Перепиши текста слайда с учетом контекста.
    Ниже сами текста. Сначала идет id элемента, затем текст.

    ${Array.from(slotMapping.entries())
        .map(([key, value]) => `${key}: ${value.content}`)
        .join('\n')}
    
Требования:
1. Создай контент для каждого слота в соответствии с его типом и назначением
2. Учитывай назначение и правила для каждого слота
3. Не меняй структуру слайда
4. Не меняй порядок элементов
5. Не меняй количество элементов
6. Придерживайся той же длины текста, что и в исходном тексте
`;
};

export default async function rewriteSlideContent(userId: string, slide: Slide) {
    try {
        const gigaChatService = GigaChatService.createGigaChatService({ userId });

        const { functionSchema, slotMapping } = createRewriteSlideContentFunction(slide);

        const prompt = createPromptRewriteSlideContent(slotMapping!);
        console.log(prompt);

        // получаем ответ от LLM
        // const response = await gigaChatService.generateFromCache(topic);
        const response = await gigaChatService.generate(prompt, {
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
