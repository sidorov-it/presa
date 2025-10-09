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
import logger from '@/utils/logger';

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
    private static rateLimiter = new RateLimiter(1);

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
            credentials: process.env.GIGACHAT_AUTH_KEY,
            model: 'GigaChat-2',
            scope: process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS',
            timeout: 600,
            verbose: true,
            httpsAgent,
        });

        this.messages = [
            {
                role: 'system',
                content: SYSTEM_PROMPT,
            },
        ];
    }
    getTokensCount(): Promise<number> {
        throw new Error('Method not implemented.');
    }

    private calculateCost(tokens: number): number {
        return (tokens / 1000) * COST_PER_1K_TOKENS;
    }

    /**
     * Determines if an error should not be retried based on error type and status code
     */
    private shouldNotRetry(error: any): boolean {
        // Check for HTTP status codes that should not be retried
        if (error.status) {
            const status = parseInt(error.status);
            // 4xx client errors that won't be fixed by retrying
            if (status === 400 || status === 401 || status === 402 || status === 403 || status === 404 || status === 409) {
                return true;
            }
        }

        // Check error message for specific patterns
        if (error.message) {
            const message = error.message.toLowerCase();
            
            // Authentication/authorization errors
            if (message.includes('unauthorized') || 
                message.includes('forbidden') || 
                message.includes('authentication') ||
                message.includes('invalid credentials') ||
                message.includes('access denied')) {
                return true;
            }

            // Payment/billing errors
            if (message.includes('payment required') || 
                message.includes('insufficient funds') ||
                message.includes('billing') ||
                message.includes('quota exceeded')) {
                return true;
            }

            // Client configuration errors
            if (message.includes('client is not initialized') ||
                message.includes('invalid request') ||
                message.includes('bad request') ||
                message.includes('malformed')) {
                return true;
            }

            // Function call validation errors (these are handled separately)
            if (message.includes('required function') && message.includes('was not called')) {
                return true;
            }

            if (message.includes('function') && message.includes('not found')) {
                return true;
            }

            if (message.includes('missing required parameters')) {
                return true;
            }
        }

        // Check for specific error types
        if (error.name === 'ValidationError' || 
            error.name === 'AuthenticationError' || 
            error.name === 'AuthorizationError') {
            return true;
        }

        return false;
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
            __retryCount?: number;
            requestId: string;
        } = {
            requestId: ''
        }
    ): Promise<LLMResponse> {
        const startTime = performance.now();
        let cached = false;
        const success = true;
        let error: string | undefined;
        let response;

        // Initialize retry counter if not provided
        const retryCount = options.__retryCount || 0;
        const maxRetries = 3;

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
                        temperature: 0.2,
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
                        __retryCount: retryCount,
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
                        inputTokens: apiResponse.usage.prompt_tokens,
                        outputTokens: apiResponse.usage.completion_tokens,
                        requestId: options.requestId || '',
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
                    provider: 'gigachat',
                    presentationId: options.presentationId,
                    requestId: options.requestId,
                    requestType: 'generate_content',
                    prompt,
                    templateId: (options as any).templateId,
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
                        retryCount,
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
        } catch (error: any) {
            console.error('Error generating content with GigaChat:', error);
            
            // Check if this error should not be retried
            if (this.shouldNotRetry(error)) {
                throw error;
            }

            // Check if we've exceeded max retries
            if (retryCount >= maxRetries) {
                console.error(`GigaChat: Max retries (${maxRetries}) exceeded for request ${options.requestId}`);
                throw error;
            }

            // Wait before retry (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
            console.log(`GigaChat: Retrying request ${options.requestId} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));

            // Retry with incremented counter
            return await this.generate(prompt, {
                ...options,
                __retryCount: retryCount + 1,
            });
        }
    }

    async generateImage(
        prompt: string, 
        options: LLMRequestContext & { __retryCount?: number }
    ): Promise<{ imageUrl: string; imageId: string }> {
        const startTime = performance.now();

        let cached = false;
        const success = true;
        let error: string | undefined;
        let result;

        // Initialize retry counter if not provided
        const retryCount = options.__retryCount || 0;
        const maxRetries = 3;

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
                    provider: 'gigachat',
                    presentationId: options?.presentationId,
                    requestId: options?.requestId,
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
                        retryCount,
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
                    const { getUploadPath } = await import('@/utils/uploadPath');
                    const UPLOAD_DIR = getUploadPath();
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
                        inputTokens: 0,
                        outputTokens: 0,
                        requestId: options.requestId || '',
                    });
                }
            }

            return result;
        } catch (error: any) {
            console.error('Error generating image:', error);
            
            // Check if this error should not be retried
            if (this.shouldNotRetry(error)) {
                throw error;
            }

            // Check if we've exceeded max retries
            if (retryCount >= maxRetries) {
                console.error(`GigaChat Image: Max retries (${maxRetries}) exceeded for request ${options.requestId}`);
                throw error;
            }

            // Wait before retry (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
            console.log(`GigaChat Image: Retrying request ${options.requestId} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));

            // Retry with incremented counter
            return await this.generateImage(prompt, {
                ...options,
                __retryCount: retryCount + 1,
            });
        }
    }

    private parseResponse(response: any): LLMResponse {
        try {
            logger.info('GigaChat response:', response);

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
                console.error(response);
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

        const { getUploadPath } = await import('@/utils/uploadPath');
        const UPLOAD_DIR = getUploadPath();
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        await fs.writeFile(filePath, content, 'binary');
    }
}
