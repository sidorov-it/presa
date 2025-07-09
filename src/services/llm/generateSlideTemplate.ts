/* eslint-disable indent */
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { createLLMService } from '@/services/llm';
import { LLMRequestContext } from '@/types/gigachat';

// Define the function schema for selecting a single slide template
const selectTemplateFunction = {
    name: 'select_slide_template',
    description: 'Выберите наиболее подходящий шаблон слайда',
    parameters: {
        type: 'object',
        properties: {
            templateId: {
                type: 'string',
                description: 'ID выбранного шаблона',
            },
            explanation: {
                type: 'string',
                description: 'Объяснение, почему был выбран этот шаблон',
            },
        },
        required: ['templateId', 'explanation'],
    },
} as const;

// Prompt generator for single slide template selection
const getTemplatePrompt = ({
    prompt,
    templates,
    durationMinutes,
    goal,
    audience,
    tone,
    surroundingSlides,
}: {
    prompt: string;
    templates: any[];
    durationMinutes?: number;
    goal?: string;
    audience?: string;
    tone?: string;
    surroundingSlides?: { title?: string; content: string }[];
}) => `Твоя задача — выбрать наиболее подходящий шаблон СЛАЙДА из предложенного списка для запроса пользователя.

Запрос пользователя (будущий контент слайда): "${prompt}"
${goal ? `Цель презентации: ${goal}\n` : ''}${audience ? `Аудитория: ${audience}\n` : ''}${tone ? `Тон/стиль: ${tone}\n` : ''}
${Number.isInteger(durationMinutes) ? `Длительность доклада: ${durationMinutes} минут\n` : ''}
${
    surroundingSlides?.length
        ? `Контекст соседних слайдов:\n${surroundingSlides
              .map((s, i) => `${i + 1}. ${s.title ? `${s.title}: ` : ''}${s.content}`)
              .join('\n')}`
        : ''
}

Доступные шаблоны:\n${templates
    .map(
        t =>
            `- ${t.name} (${t.id})\n  Описание: ${t.description}\n  Цель: ${t.purpose.join(', ')}\n  Примеры использования: ${t.useCases.join(', ')}`
    )
    .join('\n')}\n
Лучшие практики выбора шаблона:\n1. Поддерживай визуальную иерархию: ключевая мысль должна быть в центре внимания.\n2. Избегай перегрузки текстом.\n3. Учитывай аудиторию и цель презентации.\n4. Используй простые, контрастные композиции.\n5. Выбирай шаблон, который лучше всего раскрывает запрос пользователя.\n\n**ВНИМАНИЕ:** Для возврата результата ТЫ ОБЯЗАН вызвать функцию "select_slide_template".`;

const getTemplateOptions = {
    functions: [selectTemplateFunction],
    function_call: { name: 'select_slide_template' },
};

// Шаблоны, которые не стоит предлагать LLM
const excludedTemplates = [
    'three-row-table',
    'accent-top',
    'accent-left',
    'accent-right',
    'accent-right-fit',
    'accent-left-fit',
    'accent-background',
];

export default async function generateSlideTemplate({
    prompt,
    durationMinutes,
    goal,
    audience,
    tone,
    surroundingSlides,
    options,
}: {
    prompt: string;
    durationMinutes?: number;
    goal?: string;
    audience?: string;
    tone?: string;
    surroundingSlides?: { title?: string; content: string }[];
    options: LLMRequestContext;
}) {
    const llmService = createLLMService({ userId: options.userId });

    // Подготавливаем информацию о шаблонах для LLM
    const templates = Object.values(SlideTemplatesRegistry)
        .filter(template => !excludedTemplates.includes(template.id))
        .map(template => ({
            id: template.id,
            name: template.name,
            description: template.llm.description,
            purpose: template.llm.purpose,
            useCases: template.llm.useCases,
        }));

    // Получаем рекомендацию от LLM
    const response = await llmService.generate(
        getTemplatePrompt({
            prompt,
            templates,
            durationMinutes,
            goal,
            audience,
            tone,
            surroundingSlides,
        }),
        {
            ...getTemplateOptions,
            ...(options.requestId ? { requestId: options.requestId } : {}),
        }
    );

    // Парсим ответ функции
    if (response.function_call?.arguments) {
        const args = response.function_call.arguments as { templateId?: string; explanation?: string };
        return {
            templateId: args.templateId,
            explanation: args.explanation,
        };
    }

    // Fallback если функция не была вызвана корректно
    return {
        templateId: 'title-bullets',
        explanation: 'Шаблон по умолчанию',
    };
}
