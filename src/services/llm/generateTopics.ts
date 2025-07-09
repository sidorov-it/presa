import { createLLMService } from '@/services/llm';

const generateTopicsFunction = {
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
};

const getTopicsPrompt = ({
    description,
    numSlides,
    tone,
    durationMinutes,
    goal,
    audience,
}: {
    description: string;
    numSlides: number;
    tone: string;
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
${Number.isInteger(durationMinutes) ? `• Длительность доклада: ${durationMinutes} минут` : ''}

Требования к результату:
1. Сгенерируй **ровно ${numSlides}** слайдов.
2. Каждый слайд должен иметь **чёткое, сфокусированное название** и **цель**.
3. Следуй логической арке “вступление → проблема → решение → результат → CTA”.
4. Учитывай аудиторию и цель при выборе акцентов и доказательств.
5. **Формат ответа:** JSON-массив объектов со структурой

Для генерации структуры презентации ОБЯЗАТЕЛЬНО ВЫЗОВИ фунцию generate_presentation_topics!

`;

const topicsOptions = {
    functions: [generateTopicsFunction],
    function_call: { name: 'generate_presentation_topics' },
};

async function generateTopics(
    userId: string,
    {
        description,
        numSlides,
        tone,
        durationMinutes,
        goal,
        audience,
    }: {
        description: string;
        numSlides: number;
        tone: string;
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
                durationMinutes,
                goal,
                audience,
            }),
            {
                ...topicsOptions,
                ...(requestId ? { requestId } : {}),
            }
        );

        let topics = [];
        if (topicsResponse.function_call?.arguments) {
            topics = topicsResponse.function_call.arguments.topics;
        }

        // Ensure we have exactly the requested number of slides
        topics = topics.slice(0, numSlides);
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

export default generateTopics;
