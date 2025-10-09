/* eslint-disable prettier/prettier */
import { SlideTemplateCore, TemplateElement } from '@/types/templates';
import { createLLMService } from '@/services/llm';
import { ElementType } from '@/types/elements';
import getRandomString from '@/utils/getRandomString';
import { LLMRequestContext, SlotKeyMapping } from '@/types/gigachat';
import logger from '@/utils/logger';
import { TextType } from '@/types';

const fixLine = (line: string) =>
    line
    // убираем хвостовые обратные слэши и кавычки в конце строки
        .replace(/[\\"]+\s*$/g, '')
    // убираем хвостовые # (часто артефакт заголовков)
        .replace(/\s*#{1,6}\s*$/g, '')
    // нормализуем заголовки: "#Текст" -> "# Текст"
        .replace(/^(#{1,6})(?!\s)(.+)$/u, (_, h, t) => `${h} ${t.trim()}`)
    // нормализуем списки "1.Пункт" -> "1. Пункт"
        .replace(/^(\d+)\.(\S)/, (_, n, ch) => `${n}. ${ch}`)
    // нормализуем маркеры "-Текст" -> "- Текст"
        .replace(/^-\s?(?=\S)/, '- ')
    // убираем двойные кавычки в середине строки (заменяем на ёлочки)
        .replace(/"/g, '«');

const sanitizeMarkdown = (s: string) =>
    s
        .replace(/\r/g, '')
        .split('\n')
        .map(line => fixLine(line))
        .join('\n')
    // обрежем хвостовые пустые строки
        .replace(/\s+$/g, '');

const sanitizeFunctionArgs = (args: any): any => {
    if (typeof args === 'string') {
        return sanitizeMarkdown(args);
    }

    if (Array.isArray(args)) {
        return args.map(item => sanitizeFunctionArgs(item));
    }

    if (args && typeof args === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(args)) {
            sanitized[key] = sanitizeFunctionArgs(value);
        }
        return sanitized;
    }

    return args;
};

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
                } else if (element.slot) {
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

            // elementsByCell.forEach((elements, col) => {
            //     elements.forEach((element, elementIndex) => {
            //         if (element.elementTypeId === ElementType.SMART_LAYOUT) {
            //             const uniqueKey = `slot_${getRandomString(8)}`;

            //             const llmHints = element.llmHints || {};

            //             const items = element.props?.itemsSchema?.map(schema => {
            //                 const originalKey = schema.key;
            //                 const key = `${uniqueKey}_${originalKey}`;
            //                 return {
            //                     key,
            //                     originalKey,
            //                     type: schema.type || 'string',
            //                     description: llmHints.items?.[originalKey]?.description || 'Контент для элемента',
            //                     contextRules: llmHints.items?.[originalKey]?.contextRules,
            //                 };
            //             }) || [];

            //             mapping.set(uniqueKey, {
            //                 uniqueKey,
            //                 originalSlot: 'items',
            //                 layoutIndex,
            //                 column: col,
            //                 elementIndex,
            //                 items,
            //                 elementTypeId: element.elementTypeId,
            //                 llmHints: element.llmHints,
            //             });
            //         } else if (element.slot) {
            //             let uniqueKey = element.slot;
            //             let counter = 0;

            //             while (usedSlots.has(uniqueKey)) {
            //                 counter++;
            //                 uniqueKey = `${element.slot}_${counter}`;
            //             }

            //             usedSlots.add(uniqueKey);

            //             mapping.set(uniqueKey, {
            //                 uniqueKey,
            //                 originalSlot: element.slot,
            //                 layoutIndex,
            //                 column: col,
            //                 elementIndex,
            //                 elementTypeId: element.elementTypeId,
            //                 textType: element.elementTypeId === ElementType.TEXT ? element.props?.textType : undefined,
            //                 llmHints: element.llmHints,
            //             });
            //         }
            //     });
            // });
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

            let description = `Строка/блок валидного Markdown: нет хвостовых #, \\, ", один пробел после #`;

            if (value.llmHints?.purpose) {
                description += `
Описание поля: ${value.llmHints?.purpose}`
            }

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
                description,
                // contextRules: value.llmHints?.contextRules,
                properties: entryProperties,
                required,
            };
        } else if (value.textType) {
            // только для списков
            let description = `Markdown-строка списка: "- Текст" или "1. Текст", без хвостовых #".`;
            if (value.llmHints?.purpose) {
                description += `
Описание поля: ${value.llmHints?.purpose}`
            }

            properties[key] = {
                type: 'array',
                description: value.llmHints?.purpose,
                items: {
                    type: 'string',
                    description,
                },
            };
        } else {
            let description = `Строка/блок валидного Markdown: нет хвостовых #, \\, ", один пробел после # и после.`;

            if (value.llmHints?.purpose) {
                description += `
Описание поля: ${value.llmHints?.purpose}`
            }

            properties[key] = {
                type: 'string',
                description,
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
                                        let rules;

                                        if (slot.llmHints?.items?.[item?.originalKey]?.contextRules) {
                                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                            // @ts-expect-error
                                            rules = `Правила:\n ${slot.llmHints.items[item!.originalKey]!.contextRules.map(rule => `  * ${rule}`).join('\n')}`
                                        }

                                        return `    Слот "${item.key}":
        - Тип: ${item.type}
        - Назначение: ${item.description}
        ${rules ?? ''}
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

    return `Ты — функция-бот. Верни ТОЛЬКО вызов функции generate_slide_text с корректным JSON-аргументом. 
Никаких комментариев, префиксов, Markdown вне аргументов функции.

Создай структурированный контент для слайда ${slideIndex + 1} из ${totalSlides}.\n Инструкция пользователя по требуемому слайду: "${topic}".

${goal ? `Цель презентации: ${goal}\n` : ''}${audience ? `Аудитория: ${audience}\n` : ''}${tone ? `Тон/стиль: ${tone}\n` : ''}${
    Number.isInteger(durationMinutes) ? `Длительность доклада: ${durationMinutes} минут\n` : ''
}${getContentAmountGuidance(contentAmount)}

${previousSlidesSection}

Структура слайда:
${slotsDescription}

Правила Markdown внутри значений слотов (ОБЯЗАТЕЛЬНЫ):
1) Заголовки: строки вида 
   "# Текст", "## Текст", "### Текст" — ОДИН пробел после #, НЕТ # в конце.
   ✅ "# Введение"
   ❌ "#Введение"   ❌ "Введение##"   ❌ "# Введение##"
2) Обычный текст: без экранирования обратным слэшем в конце строки. Не добавляй \\ перед кавычкой.
3) Нумерованные списки: 
   каждая строка — "1. Текст", "2. Текст" (с пробелом после точки).
   ✅ "1. Первый пункт"
   ❌ "1.Первый"    ❌ "1) Первый"
4) Маркированные списки: 
   каждая строка — "- Текст" (дефис + пробел).
   ✅ "- Пункт"
   ❌ "• Пункт"     ❌ "— Пункт"
5) Цитаты: строка начинается с "> " (больше + пробел). 
6) Пустые строки допустимы ТОЛЬКО между логическими блоками; веди их умеренно.
7) Не используй кодовые блоки \`\`\` внутри значений слотов.
8) Внутри Markdown НЕ используй двойные кавычки ". Если нужны кавычки — пиши «ёлочки».
9) Последний символ каждой строки — буква/цифра или . , ! ? : ; ) ]  — НЕТ хвостовых #, \\ или " .
10) Не добавляй невидимые символы, не вставляй HTML.
11) Не добавляй символы форматирования в КОНЕЦ строки.
12) Не используй двойные кавычки внутри значений.

Требования:
1. Сгенерируй контент для КАЖДОГО слота, соблюдая тип и назначение.
2. Для слотов image опиши, какое изображение нужно сгенерировать.
3. Соблюдай логическую последовательность и связи с предыдущими слайдами.
4. **ВАЖНО**: Строго следуй указаниям по объему контента выше.
${instructions ? `5. Дополнительные инструкции: ${instructions}` : ''}

Проверь себя по чек-листу выше и верни ТОЛЬКО вызов generate_slide_text.
Если поле — массив строк, каждая строка — валидная Markdown-строка согласно правилам (без кодовых блоков).

Пример правильного вызова:
{
  "name": "generate_slide_text",
  "arguments": {
    "main_title": "# Применение ИИ в маркетинге",
    "subtitle": "## Для малого и среднего бизнеса",
    "small_subtitle": "### Введение",
    "main_text": "# Почему сейчас\\n\\n- Снижение затрат\\n- Рост конверсии\\n\\n1. Сбор данных\\n2. Персонализация\\n\\n> Автоматизация — ключ к масштабу"
  }
}

Пример неправильного вызова (это неправильно: есть хвостовые # и кавычка, так делать нельзя):
{
  "name": "generate_slide_text",
  "arguments": {
    "subtitle": "## Подзаголовок##\\"", 
    "main_title": "Применение ИИ#"
  }
}
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
    const llmService = createLLMService({
        userId: options.userId,
        provider: options.provider,
        testScenario: options.testScenario,
    });

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
    logger.info('LLM prompt (generateSlideContent):', prompt);

    // получаем ответ от LLM
    // const response = await gigaChatService.generateFromCache(topic);
    const response = await llmService.generate(prompt, {
        functions: [functionSchema],
        function_call: { name: 'generate_slide_text' },
        ...(options.requestId ? { requestId: options.requestId } : {}),
        ...(options.presentationId ? { presentationId: options.presentationId } : {}),
        templateId: template.id,
    });

    logger.info('LLM response (generateSlideContent):', JSON.stringify(response));

    // Санитизируем Markdown в ответе, если он есть
    let sanitizedArgs = response.function_call?.arguments;
    if (sanitizedArgs && typeof sanitizedArgs === 'string') {
        try {
            const parsedArgs = JSON.parse(sanitizedArgs);
            const sanitizedParsedArgs = sanitizeFunctionArgs(parsedArgs);
            sanitizedArgs = JSON.stringify(sanitizedParsedArgs);
        } catch (e) {
            logger.warn('Failed to parse function arguments for sanitization:', e);
        }
    }

    return {
        functionArgs: sanitizedArgs,
        slotMapping,
    };
}

// Explicit exports for testing purposes
export { createGenerateSlideContentFunction, createPromptGenerateSlideContent, sanitizeMarkdown };
