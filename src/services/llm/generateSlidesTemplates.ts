/* eslint-disable no-nested-ternary */
/* eslint-disable indent */
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';

import { createLLMService } from '@/services/llm';
import { LLMRequestContext } from '@/types/gigachat';

// Define the function for template selection
const createSelectTemplatesFunction = (topicsCount: number) => ({
    name: 'select_slide_templates',
    description: 'Выберите наиболее подходящий шаблон слайда для каждой темы в презентации',
    parameters: {
        type: 'object',
        properties: {
            templateSelections: {
                type: 'array',
                description: 'Список выборов шаблона для каждой темы',
                minItems: topicsCount,
                maxItems: topicsCount,
                items: {
                    type: 'object',
                    properties: {
                        topicIndex: {
                            type: 'number',
                            description: 'Индекс темы (0-based)',
                        },
                        templateId: {
                            type: 'string',
                            description:
                                'ID выбранного шаблона (Возможные значения: ' +
                                Object.values(SlideTemplatesRegistry)
                                    .map(template => template.id)
                                    .join(', ') +
                                ')',
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
});

const getContentAmountDescription = (contentAmount?: string) => {
    switch (contentAmount) {
        case 'concise':
            return 'КРАТКИЙ контент - минимум текста, только ключевые моменты, тезисы и основные идеи';
        case 'detailed':
            return 'ПОДРОБНЫЙ контент - развернутые объяснения, детали, примеры, дополнительная информация';
        case 'medium':
        default:
            return 'СРЕДНИЙ объем контента - баланс между краткостью и детальностью';
    }
};

// Enhanced prompt with XML-like markup, guard rules, and structured requirements
const getTemplatesPrompt = ({
    title,
    description,
    topics,
    templates,
    contentAmount,
    durationMinutes,
    goal,
    audience,
    tone,
}: {
    title: string;
    description: string;
    topics: any[];
    templates: any[];
    contentAmount?: string;
    durationMinutes?: number;
    goal?: string;
    audience?: string;
    tone?: string;
}) => `<task>
Выбери наиболее подходящий шаблон слайда для каждой темы презентации из предложенного списка.
</task>

<brief>
<title>${title}</title>
<description>${description}</description>
${goal ? `<goal>${goal}</goal>` : ''}
${audience ? `<audience>${audience}</audience>` : ''}
${tone ? `<tone>${tone}</tone>` : ''}
<content_amount>${getContentAmountDescription(contentAmount)}</content_amount>
${Number.isInteger(durationMinutes) ? `<duration>${durationMinutes} минут</duration>` : ''}
<slides_count>${topics.length}</slides_count>
</brief>

<templates>
${templates
    .map(
        t =>
            `<template id="${t.id}">
  <name>${t.name}</name>
  <description>${t.description}</description>
  <purpose>${t.purpose.join(', ')}</purpose>
  <use_cases>${t.useCases.join(', ')}</use_cases>
</template>`
    )
    .join('\n')}
</templates>

<topics>
${topics
    .map(
        (t, i) => `<topic index="${i}">
  <title>${t.title}</title>
  ${t.instructions ? `<instructions>${t.instructions}</instructions>` : ''}
</topic>`
    )
    .join('\n')}
</topics>

<requirements>
<quantity>Выбери ровно ${topics.length} шаблонов слайдов</quantity>
<source>Используй ТОЛЬКО имена шаблонов из &lt;templates&gt;</source>
<restrictions>
  <rule>Не придумывай новые шаблоны</rule>
  <rule>Не используй шаблоны, не указанные в списке</rule>
  <rule>Каждый шаблон должен соответствовать теме слайда</rule>
</restrictions>
</requirements>

<best_practices>
1. Поддерживай визуальную иерархию: ключевая мысль должна быть в центре внимания
2. Избегай перегрузки текстом
3. Учитывай аудиторию и цель презентации
4. Используй простые, контрастные композиции
5. Выбирай шаблон, который лучше всего раскрывает тему
6. Учитывай объем контента при выборе шаблона:
   ${
       contentAmount === 'concise'
           ? '- Для КРАТКОГО контента выбирай простые шаблоны с минимумом элементов'
           : contentAmount === 'detailed'
             ? '- Для ПОДРОБНОГО контента выбирай шаблоны с большим количеством текстовых блоков'
             : '- Для СРЕДНЕГО контента выбирай сбалансированные шаблоны'
   }
</best_practices>

<action>
Для возврата результата ОБЯЗАТЕЛЬНО вызови функцию "select_slide_templates"
</action>`;

const getTemplatesOptions = (topicsCount: number) => ({
    functions: [createSelectTemplatesFunction(topicsCount)],
    function_call: { name: 'select_slide_templates' },
});

export default async function generateSlidesTemplates({
    title,
    prompt,
    topics,
    contentAmount,
    durationMinutes,
    goal,
    audience,
    tone,
    options,
}: {
    title: string;
    prompt: string;
    topics: { title: string; instructions: string }[];
    contentAmount?: string;
    durationMinutes?: number;
    goal?: string;
    audience?: string;
    tone?: string;
    options: LLMRequestContext;
}) {
    const llmService = createLLMService({
        userId: options.userId,
        provider: options.provider,
        testScenario: options.testScenario,
    });

    // Prepare templates information for LLM
    const templates = Object.values(SlideTemplatesRegistry)
        .filter(template => !template.disabled)
        .map(template => ({
            id: template.id,
            name: template.name,
            description: template.llm.description,
            purpose: template.llm.purpose,
            useCases: template.llm.useCases,
        }));

    // Create a Set of valid template IDs for fast validation
    const validTemplateIds = new Set(templates.map(t => t.id));
    const maxRetries = 3;
    let attempt = 0;

    try {
        while (attempt < maxRetries) {
            attempt++;

            // Build the prompt (first attempt or retry with error message)
            const currentPrompt =
                attempt === 1
                    ? getTemplatesPrompt({
                          title,
                          description: prompt,
                          topics,
                          templates,
                          contentAmount,
                          durationMinutes,
                          goal,
                          audience,
                          tone,
                      })
                    : getTemplatesPrompt({
                          title,
                          description: prompt,
                          topics,
                          templates,
                          contentAmount,
                          durationMinutes,
                          goal,
                          audience,
                          tone,
                      }) +
                      `\n\n<previous_attempt_error>
ВНИМАНИЕ: В предыдущей попытке были обнаружены ошибки!
Ты указал несуществующие ID шаблонов.
Используй ТОЛЬКО следующие ID шаблонов: ${Array.from(validTemplateIds).join(', ')}
Перепроверь свой выбор и вызови функцию с СУЩЕСТВУЮЩИМИ ID шаблонов.
</previous_attempt_error>`;

            // Get template suggestions from LLM using function calling
            const templateResponse = await llmService.generate(currentPrompt, {
                ...getTemplatesOptions(topics.length),
                ...(options.requestId ? { requestId: options.requestId } : {}),
                ...(options.presentationId ? { presentationId: options.presentationId } : {}),
            });

            let templateSuggestions = [];
            if (templateResponse.function_call?.arguments) {
                const args = templateResponse.function_call.arguments;
                templateSuggestions = args.templateSelections;
            }

            // Validate that we have the correct number of suggestions
            if (templateSuggestions.length !== topics.length) {
                console.warn(
                    `LLM returned ${templateSuggestions.length} templates but expected ${topics.length}. Attempt ${attempt}/${maxRetries}`
                );
                if (attempt === maxRetries) {
                    throw new Error(
                        `LLM вернул неверное количество шаблонов: ${templateSuggestions.length} вместо ${topics.length} после ${maxRetries} попыток`
                    );
                }
                continue;
            }

            // Validate all template IDs exist
            const invalidTemplates = templateSuggestions.filter(
                (suggestion: any) => !validTemplateIds.has(suggestion.templateId)
            );

            if (invalidTemplates.length === 0) {
                // All templates are valid, return success
                console.log(`✓ Successfully validated ${templateSuggestions.length} template selections`);
                return templateSuggestions;
            }

            // Found invalid templates
            const invalidIds = invalidTemplates.map((inv: any) => inv.templateId).join(', ');
            console.warn(`⚠ Attempt ${attempt}/${maxRetries}: LLM returned invalid template IDs: ${invalidIds}`);

            if (attempt === maxRetries) {
                // Max retries reached, throw error with details
                throw new Error(
                    `LLM вернул несуществующие шаблоны после ${maxRetries} попыток. ` +
                        `Невалидные ID: ${invalidIds}. ` +
                        `Допустимые ID: ${Array.from(validTemplateIds).join(', ')}`
                );
            }

            // Continue to next attempt
        }

        // Should never reach here
        throw new Error('Не удалось получить валидные шаблоны от LLM');
    } catch (error) {
        console.error('Error generating slides templates:', error);
        throw error;
    }
}
