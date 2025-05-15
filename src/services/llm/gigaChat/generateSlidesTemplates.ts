/* eslint-disable indent */
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';

import { GigaChatService } from './gigaChat';
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

const getTemplatesPrompt = (title: string, prompt: string, topics: any[], templates: any[]) =>
    `Проанализируйте следующие темы презентации и выберите наиболее подходящий шаблон слайда для каждой темы.

Название презентации: "${title}"
Описание: "${prompt}"

Доступные шаблоны:
${templates
    .map(
        t => `
- ${t.name} (${t.id})
Описание: ${t.description}
Цель: ${t.purpose.join(', ')}
Примеры использования: ${t.useCases.join(', ')}
`
    )
    .join('\n')}

Темы для анализа:
${topics
    .map(
        (t, i) => `
${i + 1}. Тема: "${t.title}"
Инструкции: ${t.instructions || 'Нет конкретных инструкций'}`
    )
    .join('\n')}

Для каждой темы выберите наиболее подходящий шаблон на основе типа контента и цели.`;

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
    options,
}: {
    title: string;
    prompt: string;
    topics: any[];
    options: LLMRequestContext;
}) {
    const gigaChatService = GigaChatService.createGigaChatService({ userId: options.userId });

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
        const templateResponse = await gigaChatService.generate(
            getTemplatesPrompt(title, prompt, topics, templates),
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
