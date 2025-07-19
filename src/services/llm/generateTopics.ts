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
3. Следуй логической арке "вступление → проблема → решение → результат → CTA".
4. Учитывай аудиторию и цель при выборе акцентов и доказательств.
5. **Формат ответа:** JSON-массив объектов со структурой

Для генерации структуры презентации ОБЯЗАТЕЛЬНО ВЫЗОВИ фунцию generate_presentation_topics!

`;

const getDocumentTopicsPrompt = ({
    content,
    fileName,
}: {
    content: string;
    fileName: string;
}) =>
    `Проанализируй содержимое документа и создай структуру презентации на основе этого материала.

ОБЯЗАТЕЛЬНО ВЫЗОВИ фунцию generate_presentation_topics!

Входные данные:
• Имя файла: ${fileName}
• Содержимое документа:
${content}

Требования к результату:
1. Проанализируй содержимое документа и выдели основные темы и ключевые моменты
2. Создай логическую структуру презентации на основе содержания
3. Количество слайдов должно соответствовать объему и структуре материала (обычно 5-10 слайдов)
4. Каждый слайд должен иметь **чёткое, сфокусированное название** и **подробные инструкции**
5. Следуй логической последовательности изложения материала
6. Выдели введение, основные разделы и заключение

Для генерации структуры презентации ОБЯЗАТЕЛЬНО ВЫЗОВИ фунцию generate_presentation_topics!

`;

const getPlanTopicsPrompt = ({
    plan,
    tone,
    durationMinutes,
    goal,
    audience,
}: {
    plan: string;
    tone?: string;
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
${Number.isInteger(durationMinutes) ? `• Длительность доклада: ${durationMinutes} минут` : ''}

Требования к результату:
1. Проанализируй предоставленный план и создай на его основе структуру слайдов
2. Каждый пункт плана должен стать отдельным слайдом или группой слайдов
3. Каждый слайд должен иметь **чёткое, сфокусированное название** и **подробные инструкции для контента**
4. Сохрани логическую последовательность из исходного плана
5. Добавь необходимые переходные слайды если нужно
6. Учитывай цель, аудиторию и стиль при формулировке инструкций

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

export async function generateTopicsFromDocument(
    userId: string,
    {
        content,
        fileName,
    }: {
        content: string;
        fileName: string;
    },
    requestId: string
) {
    try {
        const llmService = createLLMService({ userId });

        // Generate topics from document content using function calling
        const topicsResponse = await llmService.generate(
            getDocumentTopicsPrompt({
                content,
                fileName,
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

        const title = topicsResponse.function_call?.arguments?.presentationTitle;

        return {
            title,
            topics,
        };
    } catch (error) {
        console.error('Error generating topics from document:', error);
        throw error;
    }
}

export async function generateTopicsFromPlan(
    userId: string,
    {
        plan,
        tone,
        durationMinutes,
        goal,
        audience,
    }: {
        plan: string;
        tone?: string;
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
