import { createLLMService } from './providerFactory';

const generateTopicsWithContentFunction = {
    name: 'generate_presentation_topics_with_content',
    description:
        'Создает список тем для презентации на основе контента документа, и делает выжимку из контента для каждого слайда.',
    parameters: {
        type: 'object',
        properties: {
            presentationTitle: {
                type: 'string',
                description: 'Короткий и увлекательный заголовок для презентации',
            },
            topics: {
                type: 'array',
                description: 'Список тем для презентации с контентом для каждого слайда',
                items: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description: 'Название слайда',
                        },
                        content: {
                            type: 'string',
                            description: 'Контент для этого слайда',
                        },
                    },
                    required: ['title', 'content'],
                },
            },
        },
        required: ['topics'],
    },
};

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

const getTopicsWithContentPrompt = ({
    content,
    numSlides,
    contentAmount,
    description,
    tone,
    goal,
    audience,
    durationMinutes,
}: {
    content: string;
    numSlides: number;
    contentAmount?: string;
    description?: string;
    tone?: string;
    goal?: string;
    audience?: string;
    durationMinutes?: number;
}) =>
    `Используя лучшие практики презентационного дизайна (см. список ниже), сгенерируй структуру презентации.
Для каждого слайда необходимо:
    1) Определить его тему в рамках общей логики презентации.
    2) Подобрать ключевую идею слайда.
    3) Сформировать краткую выжимку из переданного текста, релевантную теме слайда. Это должно быть содержательное, информативное, но лаконичное изложение сути, подходящее для отображения на слайде.

Результат должен представлять собой полную и логичную структуру презентации с распределением информации по слайдам

ОБЯЗАТЕЛЬНО ВЫЗОВИ фунцию generate_presentation_topics_with_content!

Входные данные:
• Количество слайдов: ${numSlides}
• Объем контента: ${getContentAmountDescription(contentAmount)}
${tone ? `• Стилистика: ${tone}` : ''}
${goal ? `• Цель презентации: ${goal}` : ''}
${audience ? `• Аудитория: ${audience}` : ''}
${durationMinutes ? `• Длительность: ${durationMinutes} минут` : ''}
${description ? `• Дополнительные требования: ${description}` : ''}

1) Сгенерируй ровно ${numSlides} слайдов — не больше и не меньше. Структура презентации должна быть завершённой и самодостаточной в рамках заданного количества слайдов.
2) Каждый слайд должен содержать:
    • Чёткое и сфокусированное название, ясно отражающее основную идею слайда.
    • Цель слайда — какую мысль он должен донести до аудитории или какое действие спровоцировать.
    • Краткую выжимку из основного текста, строго релевантную теме слайда.

3) Структура всей презентации должна соответствовать классической логике подачи:
    • Вступление — ввод в тему, установка контекста, заинтересовать.
    • Проблема — обозначение боли, барьера или неудобства.
    • Решение — как конкретно мы эту проблему решаем.
    • Результат — какие выгоды и изменения ожидаются после внедрения решения.
    • Призыв к действию (CTA) — что нужно сделать аудитории дальше (например, зарегистрироваться, попробовать, связаться и т.п.).

${description ? `4) Учти дополнительные требования: ${description}` : ''}

Для генерации структуры презентации ОБЯЗАТЕЛЬНО ВЫЗОВИ фунцию generate_presentation_topics_with_content!

Исходный текст для презентации:
${content}
`;

const topicsOptions = {
    functions: [generateTopicsWithContentFunction],
    function_call: { name: 'generate_presentation_topics_with_content' },
};

export async function generateTopicsWithContent(
    userId: string,
    {
        content,
        numSlides,
        contentAmount,
        description,
        tone,
        goal,
        audience,
        durationMinutes,
    }: {
        content: string;
        numSlides: number;
        contentAmount?: string;
        description?: string;
        tone?: string;
        goal?: string;
        audience?: string;
        durationMinutes?: number;
    },
    requestId: string,
    presentationId?: string
): Promise<{ title: string; topics: { title: string; content: string }[] }> {
    const llmService = createLLMService({ userId });

    const topicsResponse = await llmService.generate(
        getTopicsWithContentPrompt({
            content,
            numSlides,
            contentAmount,
            description,
            tone,
            goal,
            audience,
            durationMinutes,
        }),
        {
            ...topicsOptions,
            ...(requestId ? { requestId } : {}),
            ...(presentationId ? { presentationId } : {}),
        }
    );

    let topics = [];
    if (topicsResponse.function_call?.arguments) {
        topics = topicsResponse.function_call.arguments.topics;
    }

    const title = topicsResponse.function_call?.arguments?.presentationTitle;

    return {
        title,
        topics,
    };
}
