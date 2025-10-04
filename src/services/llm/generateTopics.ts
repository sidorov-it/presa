/* eslint-disable no-nested-ternary */
/* eslint-disable no-trailing-spaces */
/* eslint-disable indent */
import { createLLMService } from '@/services/llm';

const createGenerateTopicsFunction = (numSlides: number) => ({
    name: 'generate_presentation_topics',
    description:
        'Создает список тем для презентации на основе заданного описания. Выдает список тем и инструкции для каждого слайда',
    parameters: {
        type: 'object',
        properties: {
            presentationTitle: {
                type: 'string',
                description: 'Короткий и увлекательный заголовок для презентации',
            },
            topics: {
                type: 'array',
                description: 'Список тем для презентации',
                minItems: numSlides,
                maxItems: numSlides,
                items: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description: 'Название слайда',
                        },
                        instructions: {
                            type: 'string',
                            description: 'Конкретные инструкции или ключевые точки для этого слайда',
                        },
                    },
                    required: ['title', 'instructions'],
                },
            },
        },
        required: ['topics'],
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

const getTopicsPrompt = ({
    description,
    numSlides,
    tone,
    contentAmount,
    durationMinutes,
    goal,
    audience,
}: {
    description: string;
    numSlides: number;
    tone: string;
    contentAmount?: string;
    durationMinutes?: number;
    goal?: string;
    audience?: string;
}) =>
    `Используя лучшие практики презентационного дизайна (см. список), создай исчерпывающую структуру презентации.

ОБЯЗАТЕЛЬНО ВЫЗОВИ фунцию generate_presentation_topics!

Входные данные:
• Тема: ${description}
${goal ? `• Цель: ${goal}` : ''}
${audience ? `• Аудитория: ${audience}` : ''}
• Количество слайдов: ${numSlides}
• Тон/стиль: ${tone}
• Объем контента: ${getContentAmountDescription(contentAmount)}
${Number.isInteger(durationMinutes) ? `• Длительность доклада: ${durationMinutes} минут` : ''}

Требования к результату:
1. Сгенерируй **ровно ${numSlides}** слайдов.
2. Каждый слайд должен иметь **чёткое, сфокусированное название** и **цель**.
3. Следуй логической арке "вступление → проблема → решение → результат → CTA".
4. Учитывай аудиторию и цель при выборе акцентов и доказательств.
5. **Важно**: Адаптируй инструкции под выбранный объем контента:
   ${
       contentAmount === 'concise'
           ? '- Для КРАТКОГО формата: создавай инструкции для коротких, емких слайдов с минимумом текста'
           : contentAmount === 'detailed'
             ? '- Для ПОДРОБНОГО формата: создавай инструкции для развернутых слайдов с детальными объяснениями'
             : '- Для СРЕДНЕГО формата: создавай инструкции для сбалансированных слайдов с умеренным количеством информации'
   }

Для генерации структуры презентации ОБЯЗАТЕЛЬНО ВЫЗОВИ фунцию generate_presentation_topics!

`;

const getPlanTopicsPrompt = ({
    plan,
    tone,
    contentAmount,
    durationMinutes,
    goal,
    audience,
}: {
    plan: string;
    tone?: string;
    contentAmount?: string;
    durationMinutes?: number;
    goal?: string;
    audience?: string;
}) =>
    `Преобразуй готовый план презентации в структурированный список слайдов с подробными инструкциями.

ОБЯЗАТЕЛЬНО ВЫЗОВИ фунцию generate_presentation_topics!

Входные данные:
• План презентации:
${plan}
${goal ? `• Цель: ${goal}` : ''}
${audience ? `• Аудитория: ${audience}` : ''}
${tone ? `• Тон/стиль: ${tone}` : ''}
• Объем контента: ${getContentAmountDescription(contentAmount)}
${Number.isInteger(durationMinutes) ? `• Длительность доклада: ${durationMinutes} минут` : ''}

Требования к результату:
1. Проанализируй предоставленный план и создай на его основе структуру слайдов
2. Каждый пункт плана должен стать отдельным слайдом или группой слайдов
3. Каждый слайд должен иметь **чёткое, сфокусированное название** и **подробные инструкции для контента**
4. Сохрани логическую последовательность из исходного плана
5. Добавь необходимые переходные слайды если нужно
6. Учитывай цель, аудиторию и стиль при формулировке инструкций
7. **Важно**: Адаптируй инструкции под выбранный объем контента:
   ${
       contentAmount === 'concise'
           ? '- Для КРАТКОГО формата: создавай инструкции для лаконичных слайдов с основными тезисами'
           : contentAmount === 'detailed'
             ? '- Для ПОДРОБНОГО формата: создавай инструкции для развернутых слайдов с детальными разъяснениями'
             : '- Для СРЕДНЕГО формата: создавай инструкции для сбалансированных слайдов с умеренной детализацией'
   }
8. **КРИТИЧЕСКИ ВАЖНО**: Создай оптимальное количество слайдов на основе плана - не слишком мало, не слишком много. Обычно это 5-15 слайдов в зависимости от сложности темы.

Для генерации структуры презентации ОБЯЗАТЕЛЬНО ВЫЗОВИ фунцию generate_presentation_topics!

`;

const getTopicsOptions = (numSlides: number) => ({
    functions: [createGenerateTopicsFunction(numSlides)],
    function_call: { name: 'generate_presentation_topics' },
});

async function generateTopics(
    userId: string,
    {
        description,
        numSlides,
        tone,
        contentAmount,
        durationMinutes,
        goal,
        audience,
    }: {
        description: string;
        numSlides: number;
        tone: string;
        contentAmount?: string;
        durationMinutes?: number;
        goal?: string;
        audience?: string;
    },
    requestId: string
) {
    try {
        const llmService = createLLMService({ userId });

        // Generate topics using function calling
        const topicsResponse = await llmService.generate(
            getTopicsPrompt({
                description,
                numSlides,
                tone,
                contentAmount,
                durationMinutes,
                goal,
                audience,
            }),
            {
                ...getTopicsOptions(numSlides), // Exact number for direct generation
                ...(requestId ? { requestId } : {}),
            }
        );

        let topics = [];
        if (topicsResponse.function_call?.arguments) {
            topics = topicsResponse.function_call.arguments.topics;
        }

        // Ensure we have exactly the requested number of slides
        // topics = topics.slice(0, numSlides);
        while (topics.length < numSlides) {
            topics.push({
                title: `Слайд ${topics.length + 1}`,
                instructions: '',
            });
        }

        const title = topicsResponse.function_call?.arguments?.presentationTitle;

        return {
            title,
            topics,
        };
    } catch (error) {
        console.error('Error generating topics:', error);
        throw error;
    }
}

export async function generateTopicsFromPlan(
    userId: string,
    {
        plan,
        tone,
        contentAmount,
        durationMinutes,
        goal,
        audience,
    }: {
        plan: string;
        tone?: string;
        contentAmount?: string;
        durationMinutes?: number;
        goal?: string;
        audience?: string;
    },
    requestId: string
) {
    try {
        const llmService = createLLMService({ userId });

        // Generate topics from plan using function calling
        const topicsResponse = await llmService.generate(
            getPlanTopicsPrompt({
                plan,
                tone,
                contentAmount,
                durationMinutes,
                goal,
                audience,
            }),
            {
                ...getTopicsOptions(5, 15), // Flexible range for plan-based generation
                ...(requestId ? { requestId } : {}),
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
    } catch (error) {
        console.error('Error generating topics from plan:', error);
        throw error;
    }
}

export default generateTopics;
