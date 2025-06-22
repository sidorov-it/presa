import { createLLMService } from '@/services/llm';

const generateTopicsFunction = {
    name: 'generate_presentation_topics',
    description:
        'Создает список тем для презентации на основе заданного описания. Выдает список тем и инструкции для каждого слайда',
    parameters: {
        type: 'object',
        properties: {
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

const generateTitleFunction = {
    name: 'generate_presentation_title',
    description: 'Создайте короткий и увлекательный заголовок для презентации',
    parameters: {
        type: 'object',
        properties: {
            title: {
                type: 'string',
                description: 'Короткий и увлекательный заголовок для презентации',
            },
        },
        required: ['title'],
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
    `Ты — Senior Presentation Architect.

Используя лучшие практики презентационного дизайна (см. список), создай исчерпывающую структуру презентации.

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

Для генерации структуры презентации обязательно вызови фунцию generate_presentation_topics.

`;

const topicsOptions = {
    functions: [generateTopicsFunction],
    function_call: { name: 'generate_presentation_topics' },
};

const getTitlePrompt = (description: string) =>
    `Создайте короткий и увлекательный заголовок для презентации о: "${description}"
Он должен быть профессиональным и не более 60 символов.`;

const titleOptions = {
    functions: [generateTitleFunction],
    function_call: { name: 'generate_presentation_title' },
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
    }
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
            topicsOptions
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

        // Generate title using function calling
        const titleResponse = await llmService.generate(getTitlePrompt(description), titleOptions);

        let title = description;
        if (titleResponse.function_call?.arguments?.title) {
            title = titleResponse.function_call.arguments.title;
        }

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
