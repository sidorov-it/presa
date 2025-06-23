/* eslint-disable indent */
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';

import { createLLMService } from '@/services/llm';
import { LLMRequestContext } from '@/types/gigachat';

// Define the function for template selection
const selectTemplatesFunction = {
    name: 'select_slide_templates',
    description: 'Выберите наиболее подходящий шаблон слайда для каждой темы в презентации',
    parameters: {
        type: 'object',
        properties: {
            templateSelections: {
                type: 'array',
                description: 'Список выборов шаблона для каждой темы',
                items: {
                    type: 'object',
                    properties: {
                        topicIndex: {
                            type: 'number',
                            description: 'Индекс темы (0-based)',
                        },
                        templateId: {
                            type: 'string',
                            description: 'ID выбранного шаблона',
                        },
                        explanation: {
                            type: 'string',
                            description: 'Объяснение, почему был выбран этот шаблон',
                        },
                    },
                    required: ['topicIndex', 'templateId', 'explanation'],
                },
            },
        },
        required: ['templateSelections'],
    },
};

// Enhanced prompt: includes additional brief fields, sets agent role, lists best practices, and emphasises mandatory function call
const getTemplatesPrompt = ({
    title,
    description,
    topics,
    templates,
    durationMinutes,
    goal,
    audience,
    tone,
}: {
    title: string;
    description: string;
    topics: any[];
    templates: any[];
    durationMinutes?: number;
    goal?: string;
    audience?: string;
    tone?: string;
}) => `Ты — Senior Slide Template Architect.

Твоя задача — **для каждой темы презентации** выбрать наиболее подходящий шаблон слайда из предложенного списка.

Входные данные брифа:
• Название презентации: "${title}"
• Описание: "${description}"
${goal ? `• Цель: ${goal}\n` : ''}${audience ? `• Аудитория: ${audience}\n` : ''}${tone ? `• Тон/стиль: ${tone}\n` : ''}${
    Number.isInteger(durationMinutes) ? `• Длительность доклада: ${durationMinutes} минут\n` : ''
}

Доступные шаблоны:
${templates
    .map(
        t =>
            `- ${t.name} (${t.id})\n  Описание: ${t.description}\n  Цель: ${t.purpose.join(', ')}\n  Примеры использования: ${t.useCases.join(', ')}`
    )
    .join('\n')}

Темы для анализа:
${topics.map((t, i) => `${i + 1}. "${t.title}"${t.instructions ? ` — Инструкции: ${t.instructions}` : ''}`).join('\n')}

Лучшие практики выбора шаблонов:
1. Поддерживай визуальную иерархию: ключевая мысль должна быть в центре внимания.
2. Избегай перегрузки текстом — выбирай шаблоны, которые помогают краткости.
3. Учитывай аудиторию и цель презентации при выборе акцентов.
4. Используй простые, контрастные композиции и достаточные поля.
5. У двух соседних слайдов не может быть один и тот же шаблон — обеспечь разнообразие.

**Внимание:** Для возврата результата ты ОБЯЗАН вызвать функцию "select_slide_templates".
`;

const getTemplatesOptions = {
    functions: [selectTemplatesFunction],
    function_call: { name: 'select_slide_templates' },
};

const excludedTemplate = [
    'three-row-table',
    'accent-top',
    'accent-left',
    'accent-right',
    'accent-right-fit',
    'accent-left-fit',
    'accent-background',
];

export default async function generateSlidesTemplates({
    title,
    prompt,
    topics,
    durationMinutes,
    goal,
    audience,
    tone,
    options,
}: {
    title: string;
    prompt: string;
    topics: any[];
    durationMinutes?: number;
    goal?: string;
    audience?: string;
    tone?: string;
    options: LLMRequestContext;
}) {
    const llmService = createLLMService({ userId: options.userId });

    // Prepare templates information for LLM
    const templates = Object.values(SlideTemplatesRegistry)
        .filter(template => !excludedTemplate.includes(template.id))
        .map(template => ({
            id: template.id,
            name: template.name,
            description: template.llm.description,
            purpose: template.llm.purpose,
            useCases: template.llm.useCases,
        }));

    try {
        // Get template suggestions from LLM using function calling
        const templateResponse = await llmService.generate(
            getTemplatesPrompt({
                title,
                description: prompt,
                topics,
                templates,
                durationMinutes,
                goal,
                audience,
                tone,
            }),
            getTemplatesOptions
        );

        let templateSuggestions = [];
        if (templateResponse.function_call?.arguments) {
            const args = templateResponse.function_call.arguments;
            templateSuggestions = args.templateSelections;
        }

        return templateSuggestions;
        // // Create slides with suggested templates
        // const slidesData = templateSuggestions.map((suggestion: any, index: number) => {
        //     const template = SlideTemplatesRegistry[suggestion.templateId];
        //     if (!template) {
        //         // Fallback to standard template if suggested template not found
        //         return {
        //             id: `slide-${generateId()}`,
        //             title: topics[index].title,
        //             layouts: [
        //                 {
        //                     id: `layout-${generateId()}`,
        //                     type: 'single-column',
        //                     elements: [
        //                         {
        //                             id: `element-${generateId()}`,
        //                             type: 'editor',
        //                             content: topics[index].title,
        //                             cellId: `cell-${generateId()}`,
        //                         },
        //                     ],
        //                     style: {},
        //                     gridStructure: {
        //                         rows: [
        //                             {
        //                                 id: generateId(),
        //                                 cells: [
        //                                     {
        //                                         id: `cell-${generateId()}`,
        //                                         row: 0,
        //                                         column: 0,
        //                                     },
        //                                 ],
        //                             },
        //                         ],
        //                         columns: 1,
        //                         columnWidths: ['100%'],
        //                     },
        //                 },
        //             ],
        //             contentAlignment: 'center',
        //         };
        //     }

        //     // Convert template to menu item format
        //     const menuItem = TemplateTransformers.toMenuRegistry(template);
        //     // Create slide from template
        //     const slide = createSlideFromTemplate(menuItem.templateConfig!);
        //     slide.title = topics[index].title;
        //     return slide;
        // });

        // return slidesData;
    } catch (error) {
        console.error('Error generating slides templates:', error);
        throw error;
    }
}
