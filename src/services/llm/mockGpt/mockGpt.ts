import { LLMService, LLMResponse, MockGptConfig } from '@/types/llm';
import { ElementType } from '@/types/elements';
import { TextType } from '@/types';
import { markdownToHtml } from '@/utils/markdownToHtml';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { LLMHistoryService } from '../history/llmHistoryService';
import fs from 'fs';
import path from 'path';

// Placeholder content generators based on element type and context
const generatePlaceholderContent = (type: string, description?: string, purpose?: string): string => {
    const templates: Record<string, string[]> = {
        title: [
            'Заголовок презентации',
            'Основная тема слайда',
            'Ключевая идея',
            'Главная мысль',
            'Центральная концепция',
        ],
        heading: ['## Важный раздел', 'Ключевая информация', 'Основные моменты', 'Главные аспекты', 'Центральные идеи'],
        content: [
            '# Спасибо за внимание!\n\nВаше время ценно, и я рад, что смог поделиться с вами прогнозами и тенденциями в области искусственного интеллекта на ближайшие годы.',
            '### Что делать дальше?\n- Изучите материалы по ИИ и машинному обучению.\n- Подпишитесь на наши обновления, чтобы быть в курсе последних новостей.\n- Присоединяйтесь к нашим семинарам и вебинарам.',
            '### Свяжитесь со мной:\n📧 Email: example@example.com\n📞 Телефон: +123456789\n🌐 Сайт: www.example.com',
        ],
        description: [
            'Краткое описание или пояснение к основному контенту',
            'Дополнительная информация для лучшего понимания',
            'Поясняющий текст к представленным данным',
        ],
        image: ['/uploads/fbv8kc60ab1n7s95m3l5.jpg'],
    };

    // Determine content type based on description and purpose
    let contentType = 'content';
    if (description || purpose) {
        const text = (description || purpose || '').toLowerCase();
        if (text.includes('заголовок') || text.includes('title') || text.includes('heading')) {
            contentType = 'heading';
        } else if (text.includes('изображение') || text.includes('image')) {
            contentType = 'image';
        } else if (text.includes('описание') || text.includes('description')) {
            contentType = 'description';
        }
    }

    if (type === ElementType.IMAGE) {
        contentType = 'image';
    }

    const options = templates[contentType] || templates.content;
    return options[Math.floor(Math.random() * options.length)];
};

// Generate placeholder list items
const generatePlaceholderList = (count: number = 3): string[] => {
    const items = [
        'Первый важный пункт для рассмотрения',
        'Второй ключевой элемент списка',
        'Третий значимый аспект темы',
        'Четвертая составляющая проблемы',
        'Пятый компонент решения',
        'Шестой фактор успеха',
    ];

    return items.slice(0, count);
};

// Generate placeholder smart layout items
const generatePlaceholderSmartLayoutItems = (itemsSchema: any[], count: number = 3): Record<string, any> => {
    const result: Record<string, any> = {};

    for (let i = 0; i < count; i++) {
        itemsSchema.forEach(schemaItem => {
            const key = `${schemaItem.key}_${i}`;

            if (schemaItem.type === ElementType.TEXT) {
                if (schemaItem.variant === TextType.HEADING3) {
                    result[key] = `Заголовок ${i + 1}`;
                } else {
                    result[key] = markdownToHtml(generatePlaceholderContent('content', schemaItem.description));
                }
            } else if (schemaItem.type === ElementType.IMAGE) {
                result[key] = '/uploads/fbv8kc60ab1n7s95m3l5.jpg';
            } else {
                result[key] = markdownToHtml(generatePlaceholderContent('content', schemaItem.description));
            }
        });
    }

    return result;
};

// Generate placeholder chart data
const generatePlaceholderChartData = (chartType: string) => {
    const categories = ['Категория A', 'Категория B', 'Категория C', 'Категория D'];

    switch (chartType) {
        case 'bar':
        case 'line':
            return categories.map(name => ({
                name,
                value: Math.floor(Math.random() * 100) + 20,
            }));
        case 'pie':
        case 'donut':
            return categories.map(name => ({
                name,
                value: Math.floor(Math.random() * 30) + 10,
            }));
        default:
            return categories.map(name => ({
                name,
                value: Math.floor(Math.random() * 100) + 20,
            }));
    }
};

const MOCK_IMAGE_URL = '/uploads/mock-image.jpg';
const MOCK_IMAGE_ID = 'mock-image-id';

// Interface for predefined test responses
interface TestResponse {
    id: string;
    description: string;
    trigger?: {
        type: 'prompt_contains' | 'function_name' | 'template_id';
        value: string;
    };
    response: LLMResponse;
}

// Interface for test scenarios
interface TestScenario {
    name: string;
    description: string;
    responses: TestResponse[];
}

export class MockGptService implements LLMService {
    private readonly userId: string;
    private testScenario?: TestScenario;
    private testResponses: TestResponse[] = [];

    constructor(config: MockGptConfig & { testScenario?: string }) {
        this.userId = config.userId;

        // Load test scenario if specified
        if (config.testScenario) {
            this.loadTestScenario(config.testScenario);
        }
    }

    /**
     * Load test scenario from file
     */
    private loadTestScenario(scenarioName: string) {
        try {
            const scenarioPath = path.join(process.cwd(), 'src/services/llm/mockGpt/scenarios', `${scenarioName}.json`);
            if (fs.existsSync(scenarioPath)) {
                const scenarioData = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'));
                this.testScenario = scenarioData;
                this.testResponses = scenarioData.responses || [];
                console.log(`[MockGPT] Loaded test scenario: ${scenarioData.name}`);
            } else {
                console.warn(`[MockGPT] Test scenario file not found: ${scenarioPath}`);
            }
        } catch (error) {
            console.error(`[MockGPT] Error loading test scenario: ${error}`);
        }
    }

    /**
     * Find matching test response based on prompt and options
     */
    private findTestResponse(prompt: string, options?: any): TestResponse | null {
        for (const testResponse of this.testResponses) {
            if (!testResponse.trigger) {
                continue;
            }

            const { type, value } = testResponse.trigger;

            switch (type) {
                case 'prompt_contains':
                    if (prompt.toLowerCase().includes(value.toLowerCase())) {
                        return testResponse;
                    }
                    break;
                case 'function_name':
                    if (options?.function_call?.name === value) {
                        return testResponse;
                    }
                    break;
                case 'template_id':
                    if (prompt.toLowerCase().includes(value.toLowerCase()) && value !== '-') {
                        return testResponse;
                    }
                    break;
            }
        }

        return null;
    }

    async getTokensCount(_text: string): Promise<number> {
        return 0;
    }

    async generate(
        prompt: string,
        options?: {
            functions?: any[];
            function_call?: any;
            presentationId?: string;
            requireFunctionCall?: boolean;
            __attemptCount?: number;
            __retryCount?: number;
            requestId?: string;
        }
    ): Promise<LLMResponse> {
        // Initialize retry counter if not provided
        const retryCount = options?.__retryCount || 0;

        const log = async (response: LLMResponse): Promise<LLMResponse> => {
            await LLMHistoryService.logRequest({
                userId: this.userId,
                provider: 'mock',
                presentationId: options?.presentationId,
                requestId: options?.requestId,
                requestType: 'generate_content',
                prompt,
                templateId: (options as any).templateId,
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                duration: 0,
                cached: false,
                cost: 0,
                success: true,
                metadata: {
                    ...(this.testScenario ? { scenario: this.testScenario.name } : {}),
                    retryCount,
                },
                responseContent: JSON.stringify(response),
            });
            return response;
        };

        // Check for predefined test responses first
        const testResponse = this.findTestResponse(prompt, options);
        if (testResponse) {
            console.log(`[MockGPT] Using test response: ${testResponse.id} - ${testResponse.description}`);
            return await log(testResponse.response);
        }

        // Если требуется function_call, генерируем соответствующий ответ
        if (options?.function_call && options.functions) {
            const functionName = options.function_call.name;
            const functionSchema = options.functions.find(f => f.name === functionName);

            if (functionSchema) {
                // Специальная обработка для generate_presentation_topics
                if (functionName === 'generate_presentation_topics') {
                    // Получаем все доступные шаблоны (не disabled)
                    const templates = Object.values(SlideTemplatesRegistry).filter(t => !t.disabled);

                    const filteredTemplates = templates.filter(t =>
                        ['welcome-slide', 'final-slide-contacts', 'final-slide-contacts-qr'].includes(t.id)
                    );

                    const mockTopics = filteredTemplates.map(template => ({
                        title: `Слайд для шаблона ${template.name}`,
                        instructions: `Использовать шаблон: ${template.id}`,
                    }));

                    return await log({
                        elements: [],
                        function_call: {
                            name: functionName,
                            arguments: {
                                presentationTitle: 'Презентация с примерами всех шаблонов',
                                topics: mockTopics,
                            },
                        },
                    });
                }

                // Специальная обработка для select_slide_templates
                if (functionName === 'select_slide_templates') {
                    // Получаем все доступные шаблоны (не disabled)
                    const templates = Object.values(SlideTemplatesRegistry).filter(t => !t.disabled);
                    const filteredTemplates = templates.filter(t =>
                        ['welcome-slide', 'final-slide-contacts', 'final-slide-contacts-qr'].includes(t.id)
                    );
                    const mockTemplateSelections = filteredTemplates.map((template, idx) => ({
                        topicIndex: idx,
                        templateId: template.id,
                        explanation: `Демонстрация шаблона ${template.id}`,
                    }));

                    return await log({
                        elements: [],
                        function_call: {
                            name: functionName,
                            arguments: {
                                templateSelections: mockTemplateSelections,
                            },
                        },
                    });
                }

                // Специальная обработка для select_slide_template (единичный выбор)
                if (functionName === 'select_slide_template') {
                    return await log({
                        elements: [],
                        function_call: {
                            name: functionName,
                            arguments: {
                                templateId: 'two-columns',
                                explanation:
                                    'Универсальный двухколоночный шаблон подходит для большинства типов контента',
                            },
                        },
                    });
                }

                // Обработка для generate_slide_text (генерация контента слайда)
                if (functionName === 'generate_slide_text') {
                    const placeholderArgs: Record<string, any> = {};

                    // Генерируем placeholder контент на основе схемы функции
                    for (const [key, propertySchema] of Object.entries(functionSchema.parameters.properties || {})) {
                        const typedPropertySchema = propertySchema as any;

                        if (typedPropertySchema.type === 'object') {
                            // Smart layout items
                            if (typedPropertySchema.properties) {
                                const itemsSchema = Object.entries(typedPropertySchema.properties).map(
                                    ([itemKey, itemSchema]: [string, any]) => ({
                                        key: itemKey,
                                        type: itemSchema.type || 'string',
                                        description: itemSchema.description,
                                    })
                                );
                                const itemsData = generatePlaceholderSmartLayoutItems(itemsSchema, 3);
                                placeholderArgs[key] = itemsData;
                            }
                        } else if (typedPropertySchema.type === 'array') {
                            // List items
                            placeholderArgs[key] = generatePlaceholderList(3);
                        } else {
                            // String content
                            const description = typedPropertySchema.description;

                            // Special handling for chart data
                            if (key.includes('chart') || description?.includes('диаграмм')) {
                                const chartData = generatePlaceholderChartData('bar');
                                placeholderArgs[key] = JSON.stringify(chartData);
                            } else {
                                placeholderArgs[key] = markdownToHtml(
                                    generatePlaceholderContent('content', description)
                                );
                            }
                        }
                    }

                    return await log({
                        elements: [],
                        function_call: {
                            name: functionName,
                            arguments: placeholderArgs,
                        },
                    });
                }

                // Обработка для rewrite_slide_text (переписывание контента слайда)
                if (functionName === 'rewrite_slide_text') {
                    const placeholderArgs: Record<string, any> = {};

                    // Генерируем улучшенный контент на основе схемы функции
                    for (const [key, propertySchema] of Object.entries(functionSchema.parameters.properties || {})) {
                        const typedPropertySchema = propertySchema as any;

                        if (typedPropertySchema.type === 'object') {
                            // Smart layout items
                            if (typedPropertySchema.properties) {
                                const itemsSchema = Object.entries(typedPropertySchema.properties).map(
                                    ([itemKey, itemSchema]: [string, any]) => ({
                                        key: itemKey,
                                        type: itemSchema.type || 'string',
                                        description: itemSchema.description,
                                    })
                                );
                                const itemsData = generatePlaceholderSmartLayoutItems(itemsSchema, 3);
                                placeholderArgs[key] = itemsData;
                            }
                        } else if (typedPropertySchema.type === 'array') {
                            // List items - для переписывания возвращаем улучшенные варианты
                            placeholderArgs[key] = [
                                'Улучшенный первый пункт с более детальной информацией',
                                'Переработанный второй элемент списка с лучшей формулировкой',
                                'Усовершенствованный третий аспект с дополнительными деталями',
                            ];
                        } else {
                            // String content - генерируем улучшенные версии
                            const description = typedPropertySchema.description;

                            if (key.includes('chart') || description?.includes('диаграмм')) {
                                const chartData = generatePlaceholderChartData('bar');
                                placeholderArgs[key] = JSON.stringify(chartData);
                            } else {
                                // Для переписывания используем более качественные варианты контента
                                const improvedContent = [
                                    '## Улучшенный заголовок\n\nЭто переработанная версия контента с более четкой структурой и лучшей подачей информации.',
                                    '### Ключевые моменты\n- Первый важный аспект с детальным объяснением\n- Второй существенный элемент с примерами\n- Третий критический фактор с практическими выводами',
                                    '**Заключение:** Данный контент был значительно улучшен для лучшего восприятия и понимания аудиторией.',
                                ];
                                placeholderArgs[key] = markdownToHtml(
                                    improvedContent[Math.floor(Math.random() * improvedContent.length)]
                                );
                            }
                        }
                    }

                    return await log({
                        elements: [],
                        function_call: {
                            name: functionName,
                            arguments: placeholderArgs,
                        },
                    });
                }

                // Fallback для других function_call
                return await log({
                    elements: [],
                    function_call: {
                        name: functionName,
                        arguments: { result: 'Mock response for ' + functionName },
                    },
                });
            }
        }

        // Обычный текстовый ответ
        return await log({
            elements: [
                {
                    type: 'text',
                    content: 'Это тестовый ответ mock LLM. Ваш запрос успешно обработан.',
                    metadata: {},
                },
            ],
        });
    }

    /**
     * Determines if an error should not be retried based on error type and status code
     * For MockGPT, most errors should not be retried as they are usually configuration issues
     */
    private shouldNotRetry(error: any): boolean {
        // MockGPT rarely has retryable errors, but we can still check for common patterns

        // Check error message for specific patterns
        if (error.message) {
            const message = error.message.toLowerCase();

            // Configuration errors
            if (
                message.includes('test scenario') ||
                message.includes('configuration') ||
                message.includes('not found')
            ) {
                return true;
            }
        }

        // For MockGPT, we generally don't retry as it's for testing
        return true;
    }

    async generateImage(
        _prompt: string,
        _options: { presentationId?: string; userId: string; requestId?: string; __retryCount?: number }
    ): Promise<{ imageUrl: string; imageId: string }> {
        await LLMHistoryService.logRequest({
            userId: this.userId,
            provider: 'mock',
            presentationId: _options.presentationId,
            requestId: _options.requestId,
            requestType: 'generate_image',
            prompt: _prompt,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            duration: 0,
            cached: false,
            cost: 0,
            success: true,
            metadata: {
                ...(this.testScenario ? { scenario: this.testScenario.name } : {}),
                retryCount: _options.__retryCount || 0,
            },
            responseContent: JSON.stringify({ imageUrl: MOCK_IMAGE_URL, imageId: MOCK_IMAGE_ID }),
        });
        return {
            imageUrl: MOCK_IMAGE_URL,
            imageId: MOCK_IMAGE_ID,
        };
    }
}

export default MockGptService;
