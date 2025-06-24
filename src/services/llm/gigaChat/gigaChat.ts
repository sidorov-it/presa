/* eslint-disable prettier/prettier */
import { Agent } from 'https';
import path from 'path';
import fs from 'fs/promises';
import GigaChat, { detectImage } from 'gigachat';
import { performance } from 'perf_hooks';
import { GigaChatConfig, LLMResponse, LLMService } from '@/types/llm';
import { RateLimiter } from '../rateLimiter';
import { RecordingOptions } from '@/types/llm/recordings';
import { RecordingService } from '../recordings/recordingService';
import { LLMHistoryService, LLMRequestData } from '../history/llmHistoryService';

import { replyConfig } from './replyConfig';
import { LLMRequestContext } from '@/types/gigachat';
import { SYSTEM_PROMPT } from '@/prompts';

interface Message {
    role: string;
    content: string;
    function_call?: {
        name: string;
        arguments: any;
    };
}

const COST_PER_1K_TOKENS = (5000 / 25000000) * 1000;

const GIGACHAT_AUTH_KEY = process.env.GIGACHAT_AUTH_KEY!;
const GIGACHAT_SCOPE = process.env.GIGACHAT_SCOPE;

export class GigaChatService implements LLMService {
    private client!: GigaChat;
    private messages: Message[] = [];
    private recordingService?: RecordingService;
    private recordingOptions: RecordingOptions;
    private userId: string;
    private static rateLimiter = new RateLimiter(10);

    static createGigaChatService(config: GigaChatConfig) {
        return new GigaChatService(config);
    }

    private async withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
        return GigaChatService.rateLimiter.run(fn);
    }

    constructor(config: GigaChatConfig) {
        this.recordingOptions = replyConfig;
        this.userId = config.userId;

        if (replyConfig.enabled || replyConfig.replayMode) {
            this.recordingService = new RecordingService(replyConfig.storageKey);
        }

        const httpsAgent = new Agent({
            rejectUnauthorized: false,
        });

        this.client = new GigaChat({
            dangerouslyAllowBrowser: true,
            credentials: GIGACHAT_AUTH_KEY,
            model: 'GigaChat-2',
            scope: GIGACHAT_SCOPE || 'GIGACHAT_API_PERS',
            timeout: 600,
            httpsAgent,
        });

        this.messages = [
            {
                role: 'system',
                content: SYSTEM_PROMPT,
            },
        ];
    }

    private calculateCost(tokens: number): number {
        return (tokens / 1000) * COST_PER_1K_TOKENS;
    }

    async generateFromCache(prompt: string): Promise<LLMResponse> {
        const recording = await this.recordingService?.findRecordingByPrompt(prompt);
        return recording?.response.data;
    }

    async generate(
        prompt: string,
        options: {
            presentationId?: string;
            functions?: any[];
            function_call?: any;
            requireFunctionCall?: boolean;
            __attemptCount?: number;
        } = {}
    ): Promise<LLMResponse> {
        const startTime = performance.now();
        let cached = false;
        const success = true;
        let error: string | undefined;
        let response;

        try {
            // Try to get recorded response first in replay mode
            if (this.recordingOptions.replayMode && this.recordingService) {
                const recording = await this.recordingService.findRecording(prompt, options);
                if (recording && recording.response.type === 'chat') {
                    cached = true;
                    response = recording.response.data;
                }
            }

            if (!cached) {
                if (!this.client) {
                    throw new Error('GigaChat client is not initialized');
                }

                const messages: Message[] = [
                    {
                        role: 'system',
                        content:
                            'Ты профессиональный создатель презентаций. Твоя задача - генерировать контент для слайдов презентации. Предоставляй контент в четком, структурированном формате, который можно легко анализировать.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ];

                const {
                    requireFunctionCall = typeof options.function_call !== 'undefined',
                    __attemptCount = 0,
                    ...chatOptions
                } = options as any;

                const apiResponse = await this.withRateLimit(async () => {
                    await this.client.updateToken();
                    return this.client.chat({
                        messages: messages,
                        ...chatOptions,
                    });
                });

                const parsedResponse = this.parseResponse(apiResponse);

                // ------------------------------------------------------------------
                //  Require function call retry logic
                // ------------------------------------------------------------------
                if (requireFunctionCall && !parsedResponse.function_call) {
                    if (__attemptCount >= 2) {
                        // Exceeded retry limit (attempts are zero-indexed internally)
                        throw new Error(
                            `Required function ${chatOptions.function_call?.name || ''} was not called after 3 attempts`
                        );
                    }

                    const functionSpec = (chatOptions.functions || []).find(
                        (f: any) => f.name === chatOptions.function_call?.name
                    );

                    const retryPrompt = `Вы не вызвали обязательную функцию «${chatOptions.function_call?.name}». Пожалуйста, вызовите её, используя корректные аргументы.\n\nОписание функции:\n${JSON.stringify(
                        functionSpec || {},
                        null,
                        2
                    )}\n\nИсходный запрос пользователя:\n${prompt}`;

                    return await this.generate(retryPrompt, {
                        ...chatOptions,
                        requireFunctionCall: true,
                        __attemptCount: __attemptCount + 1,
                    });
                }

                // Save recording if enabled
                if (this.recordingOptions.enabled && this.recordingService) {
                    await this.recordingService.saveRecording({
                        prompt,
                        options,
                        response: {
                            type: 'chat',
                            data: parsedResponse,
                        },
                    });
                }

                // Calculate metrics
                const inputTokens = apiResponse.usage.prompt_tokens;
                const outputTokens = apiResponse.usage.completion_tokens;
                const totalTokens = apiResponse.usage.total_tokens;
                const duration = Math.round(performance.now() - startTime);
                const cost = this.calculateCost(totalTokens);

                const logMessage: LLMRequestData = {
                    userId: this.userId,
                    presentationId: options.presentationId,
                    requestType: 'generate_content',
                    prompt,
                    inputTokens,
                    outputTokens,
                    totalTokens,
                    duration,
                    cached,
                    cost,
                    success,
                    errorMessage: error,
                    metadata: {
                        options,
                        response,
                    },
                };

                if (parsedResponse.function_call) {
                    try {
                        messages.push({
                            role: 'assistant',
                            content: '',
                            function_call: {
                                name: parsedResponse.function_call.name,
                                arguments: parsedResponse.function_call.arguments,
                            },
                        });

                        const functionSpec = options.functions?.find(
                            f => f.name === parsedResponse.function_call?.name
                        );
                        if (!functionSpec) {
                            throw new Error(`Function ${parsedResponse.function_call.name} not found`);
                        }

                        try {
                            const args = parsedResponse.function_call.arguments;
                            const requiredParams = functionSpec.parameters.required || [];
                            const missingParams = requiredParams.filter((param: string) => !(param in args));

                            if (missingParams.length > 0) {
                                throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
                            }

                            messages.push({
                                role: 'function',
                                content: JSON.stringify({ status: 'success', result: args }),
                            });

                            logMessage.functionCall = (parsedResponse as LLMResponse).function_call?.name || '';
                            logMessage.functionArguments = JSON.stringify(
                                (parsedResponse as LLMResponse).function_call?.arguments || {}
                            );
                            logMessage.responseContent = apiResponse?.choices[0]?.message.content;

                            await LLMHistoryService.logRequest(logMessage);

                            return parsedResponse;
                        } catch (validationError: any) {
                            messages.push({
                                role: 'function',
                                content: JSON.stringify({
                                    status: 'error',
                                    error: validationError.message,
                                    message:
                                        'Please try again with valid arguments that match the function specification.',
                                }),
                            });

                            return await this.generate(prompt, options);
                        }
                    } catch (error) {
                        console.error('Error handling function call:', error);
                        throw error;
                    }
                }

                logMessage.responseContent = apiResponse.choices[0]?.message.content;

                // Log request history
                await LLMHistoryService.logRequest(logMessage);

                this.messages.push({
                    role: 'assistant',
                    content: apiResponse.choices[0]?.message.content || '',
                });
            }

            return response;
        } catch (error) {
            console.error('Error generating content with GigaChat:', error);
            throw error;
        }
    }

    async generateImage(prompt: string, options: LLMRequestContext): Promise<{ imageUrl: string; imageId: string }> {
        const startTime = performance.now();

        let cached = false;
        const success = true;
        let error: string | undefined;
        let result;

        try {
            const DEFAULT_SYSTEM_PROMPT = 'Сгенерируй изображение для презентации';

            // Try to get recorded response first in replay mode
            if (this.recordingOptions.replayMode && this.recordingService) {
                const recording = await this.recordingService.findRecording(prompt);
                if (recording && recording.response.type === 'image') {
                    cached = true;
                    result = recording.response.data;
                }
            }

            if (!cached) {
                if (!this.client) {
                    throw new Error('GigaChat client is not initialized');
                }

                const response = await this.withRateLimit(() =>
                    this.client.chat({
                        messages: [
                            {
                                role: 'system',
                                content: DEFAULT_SYSTEM_PROMPT,
                            },
                            {
                                role: 'user',
                                content: prompt,
                            },
                        ],
                        function_call: { name: 'text2image' },
                    })
                );

                // Calculate metrics
                const inputTokens = response.usage.prompt_tokens;
                const duration = Math.round(performance.now() - startTime);
                const cost = this.calculateCost(response.usage.total_tokens); // Image generation might have different pricing

                const logMessage: LLMRequestData = {
                    userId: this.userId,
                    presentationId: options?.presentationId,
                    requestType: 'generate_image',
                    prompt,
                    inputTokens,
                    outputTokens: 0, // Images don't have output tokens
                    totalTokens: response.usage.total_tokens,
                    functionCall: 'text2image',
                    functionArguments: JSON.stringify({}),
                    responseContent: response.choices[0]?.message.content,
                    duration,
                    cached,
                    cost,
                    success,
                    errorMessage: error,
                    metadata: {
                        options,
                    },
                };

                // Log request history
                await LLMHistoryService.logRequest(logMessage);

                const detectedImage = detectImage(response.choices[0]?.message.content ?? '');
                if (!detectedImage || !detectedImage.uuid) {
                    throw new Error('Failed to generate image: No image ID in response');
                }

                const image = await this.client.getImage(detectedImage.uuid);

                if (typeof window === 'undefined') {
                    const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
                    const filePath = path.join(UPLOAD_DIR, `${detectedImage.uuid}.jpg`);
                    await this.saveImageToFile(filePath, image.content);
                    const imageUrl = `/uploads/${detectedImage.uuid}.jpg`;
                    result = {
                        imageUrl,
                        imageId: detectedImage.uuid,
                    };
                } else {
                    const imageUrl = `data:image/jpeg;base64,${image.content.toString('base64')}`;
                    result = {
                        imageUrl,
                        imageId: detectedImage.uuid,
                    };
                }

                // Save recording if enabled
                if (this.recordingOptions.enabled && this.recordingService) {
                    await this.recordingService.saveRecording({
                        prompt,
                        response: {
                            type: 'image',
                            data: result,
                        },
                    });
                }
            }

            return result;
        } catch (error) {
            console.error('Error generating image:', error);
            throw error;
        }
    }

    private parseResponse(response: any): LLMResponse {
        try {
            const message = response.choices[0]?.message;
            if (!message) {
                throw new Error('Empty response from GigaChat');
            }

            if (message.function_call) {
                return {
                    elements: [],
                    function_call: {
                        name: message.function_call.name,
                        arguments: message.function_call.arguments,
                    },
                };
            }

            const content = message.content;
            if (!content) {
                console.error(message);
                throw new Error('Empty content in GigaChat response');
            }

            const elements = content.split('\n\n').map((block: string) => {
                if (block.toLowerCase().includes('image:')) {
                    return {
                        type: 'image',
                        content: block.replace(/^image:\s*/i, '').trim(),
                        metadata: {},
                    };
                }
                return {
                    type: 'text',
                    content: block.trim(),
                    metadata: {},
                };
            });

            return { elements };
        } catch (error) {
            console.error('Error parsing GigaChat response:', error);
            throw new Error('Failed to parse GigaChat response');
        }
    }

    private async saveImageToFile(filePath: string, content: Buffer): Promise<void> {
        if (typeof window !== 'undefined') {
            throw new Error('File operations can only be performed on the server side');
        }

        const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        await fs.writeFile(filePath, content, 'binary');
    }
}
