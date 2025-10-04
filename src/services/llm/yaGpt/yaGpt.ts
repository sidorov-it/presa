import { LLMResponse, LLMService, YaGptConfig } from '@/types/llm';
import { RateLimiter } from '../rateLimiter';
import { LLMHistoryService, LLMRequestData } from '../history/llmHistoryService';
import { RecordingOptions } from '@/types/llm/recordings';
import { RecordingService } from '../recordings/recordingService';
import { replyConfig } from '../gigaChat/replyConfig';
import { SYSTEM_PROMPT } from '@/prompts';
import logger from '@/utils/logger';

interface YaGPTMessage {
    role: 'system' | 'user' | 'assistant';
    text: string;
}

// -----------------------------------------------------------------------------
//  Pricing constants (in RUB)
//  - Text generation: 0.20 ₽ per 1 000 tokens (synchronous mode)
//  - Image generation (Yandex ART): 2.20 ₽ per request
// -----------------------------------------------------------------------------

const COST_PER_1K_TOKENS = 0.2; // ₽
const IMAGE_GENERATION_COST = 2.2; // ₽

export class YaGptService implements LLMService {
    private static rateLimiter = new RateLimiter(10);
    private apiKey: string;
    private readonly folderId: string;
    private readonly userId: string;
    private recordingService?: RecordingService;
    private recordingOptions: RecordingOptions;
    private static cachedApiKey: string | null = null;

    constructor(config: YaGptConfig) {
        if (!process.env.YAGPT_FOLDER_ID) {
            throw new Error('YAGPT_FOLDER_ID environment variable is required');
        }

        // Prefer explicit API key if provided; otherwise attempt to create using IAM token and service account id.
        if (process.env.YAGPT_API_KEY) {
            this.apiKey = process.env.YAGPT_API_KEY;
        } else {
            if (!process.env.YAGPT_IAM_TOKEN || !process.env.YAGPT_SERVICE_ACCOUNT_ID) {
                throw new Error(
                    'Either YAGPT_API_KEY or both YAGPT_IAM_TOKEN and YAGPT_SERVICE_ACCOUNT_ID environment variables must be set'
                );
            }
            this.apiKey = '';
        }
        this.folderId = process.env.YAGPT_FOLDER_ID;
        this.userId = config.userId;

        // Initialize recording service
        this.recordingOptions = replyConfig;
        if (replyConfig.enabled || replyConfig.replayMode) {
            this.recordingService = new RecordingService(replyConfig.storageKey);
        }
    }

    async getTokensCount(text: string): Promise<number> {
        const apiKey = process.env.YAGPT_IAM_TOKEN;

        const tokenResponse = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/tokenize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Api-Key ${apiKey}`,
                'x-folder-id': this.folderId,
            },
            body: JSON.stringify({
                modelUri: `gpt://${this.folderId}/yandexgpt-lite`,
                text,
            }),
        });

        const result = await tokenResponse.json();
        return result.tokens.length;
    }
    static createYaGptService(config: YaGptConfig) {
        return new YaGptService(config);
    }

    private async withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
        return YaGptService.rateLimiter.run(fn);
    }

    private buildRequestBody(
        prompt: string,
        callOptions?: { functions?: any[]; function_call?: any }
    ): Record<string, unknown> {
        const messages: YaGPTMessage[] = [
            {
                role: 'system',
                text: SYSTEM_PROMPT,
            },
            { role: 'user', text: prompt },
        ];

        const request: Record<string, unknown> = {
            modelUri: `gpt://${this.folderId}/yandexgpt/latest`,
            completionOptions: {
                stream: false,
                temperature: 0.4,
                maxTokens: 2048,
            },
            messages,
        };

        if (callOptions?.functions && callOptions.functions.length) {
            // YandexGPT expects tools: [ { function: {...schema} } ]
            request.tools = callOptions.functions.map(fn => ({ function: fn }));
        }

        return request;
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
            requestId?: string;
        } = {}
    ): Promise<LLMResponse> {
        const start = Date.now();

        // Initialize retry counter if not provided
        const retryCount = options.__retryCount || 0;
        const maxRetries = 3;

        logger.debug('YaGPT generate', { prompt, options, retryCount });
        // ------------------------------------------------------------------
        //  RecordingService replay mode: return cached response if available
        // ------------------------------------------------------------------
        if (this.recordingOptions.replayMode && this.recordingService) {
            const cachedRecording = await this.recordingService.findRecording(prompt, options);
            if (cachedRecording && cachedRecording.response.type === 'chat') {
                logger.debug('YaGPT generate: cached response found', { cachedRecording, options });
                return cachedRecording.response.data as LLMResponse;
            }
        }

        const endpoint = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';

        // Ensure we have an API key ready
        const apiKey = process.env.YAGPT_IAM_TOKEN;

        const {
            requireFunctionCall = typeof options.function_call !== 'undefined',
            __attemptCount = 0,
            ...chatOptions
        } = options as any;

        const body = this.buildRequestBody(prompt, chatOptions);

        logger.debug('YaGPT generate: request llm', { body });

        let responseJson;
        try {
            responseJson = await this.withRateLimit(async () => {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Api-Key ${apiKey}`,
                    },
                    body: JSON.stringify(body),
                });

                if (!res.ok) {
                    const text = await res.text();
                    const error = new Error(`YaGPT API error: ${res.status} - ${text}`);
                    (error as any).status = res.status;
                    throw error;
                }

                return res.json();
            });
        } catch (error: any) {
            logger.error('YaGPT generate: API error', { error, retryCount });

            // Check if this error should not be retried
            if (this.shouldNotRetry(error)) {
                throw error;
            }

            // Check if we've exceeded max retries
            if (retryCount >= maxRetries) {
                logger.error(`YaGPT: Max retries (${maxRetries}) exceeded for request ${options.requestId}`);
                throw error;
            }

            // Wait before retry (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
            logger.info(
                `YaGPT: Retrying request ${options.requestId} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`
            );
            await new Promise(resolve => setTimeout(resolve, delay));

            // Retry with incremented counter
            return await this.generate(prompt, {
                ...options,
                __retryCount: retryCount + 1,
            });
        }

        logger.debug('YaGPT generate: response llm', { responseJson });
        const yaResult = responseJson.result || responseJson;
        const firstAlt = yaResult.alternatives?.[0] || {};
        const message =
            firstAlt.message ||
            yaResult.message ||
            responseJson.message ||
            responseJson.choices?.[0]?.message ||
            responseJson.choices?.[0];

        let elements = [] as LLMResponse['elements'];
        let functionCall: LLMResponse['function_call'];

        if (message?.toolCallList?.toolCalls?.length) {
            logger.debug('YaGPT generate: function call found', { message });
            const tool = message.toolCallList.toolCalls[0];
            functionCall = {
                name: tool.functionCall?.name,
                arguments: tool.functionCall?.arguments,
            };
        } else if (message?.function_call) {
            logger.debug('YaGPT generate: function call found', { message });
            functionCall = {
                name: message.function_call.name,
                arguments: message.function_call.arguments,
            };
        } else {
            logger.debug('YaGPT generate: text response found', { message });
            const textResponse: string = message?.text || message?.content || '';

            elements = textResponse
                .split('\n\n')
                .filter((b: string) => b.trim().length)
                .map((block: string) => {
                    if (block.toLowerCase().startsWith('image:')) {
                        return {
                            type: 'image' as const,
                            content: block.replace(/^image:\s*/i, '').trim(),
                            metadata: {},
                        };
                    }

                    return {
                        type: 'text' as const,
                        content: block.trim(),
                        metadata: {},
                    };
                });
        }

        logger.debug('YaGPT generate: elements', { elements });

        const duration = Date.now() - start;

        // Attempt to read token information if provided (YaGPT may not provide it)
        const totalTokens: number = parseInt(responseJson.result.usage?.totalTokens, 10) ?? 0;
        const inputTokens: number = parseInt(responseJson.result.usage?.inputTextTokens, 10) ?? 0;
        const outputTokens: number = parseInt(responseJson.result.usage?.completionTokens, 10) ?? 0;

        const cost = this.calculateCost(totalTokens);

        const logData: LLMRequestData = {
            userId: this.userId,
            provider: 'yagpt',
            presentationId: options.presentationId,
            requestId: options.requestId,
            requestType: 'generate_content',
            prompt,
            templateId: (options as any).templateId,
            inputTokens,
            outputTokens,
            totalTokens,
            duration,
            cached: false,
            cost,
            success: true,
            errorMessage: undefined,
            metadata: {
                provider: 'yagpt',
            },
        };

        // Check if function call is required but absent
        if (requireFunctionCall && !functionCall) {
            if (__attemptCount >= 2) {
                logger.debug('YaGPT generate: function call required but not found. Attempts exceeded', {
                    chatOptions,
                    __attemptCount,
                });
                throw new Error(
                    `Required function ${chatOptions.function_call?.name || ''} was not called after 3 attempts`
                );
            }

            logger.debug('YaGPT generate: function call required but absent', { chatOptions, __attemptCount });
            const functionSpec = (chatOptions.functions || []).find(
                (f: any) => f.name === chatOptions.function_call?.name
            );

            const retryPrompt = `Вы не вызвали обязательную функцию «${chatOptions.function_call?.name}». Пожалуйста, вызовите её, используя корректные аргументы.\n\nОписание функции:\n${JSON.stringify(
                functionSpec || {},
                null,
                2
            )}\n\nИсходный запрос пользователя:\n${prompt}`;

            return this.generate(retryPrompt, {
                ...chatOptions,
                requireFunctionCall: true,
                __attemptCount: __attemptCount + 1,
                __retryCount: retryCount,
            });
        }

        const responseData: LLMResponse = {
            elements,
            ...(functionCall ? { function_call: functionCall } : {}),
        };

        logger.debug('YaGPT generate: response data', { responseData });

        logData.responseContent = JSON.stringify(responseData);
        logData.metadata = {
            provider: 'yagpt',
            retryCount,
        };
        await LLMHistoryService.logRequest(logData);

        // Save recording if enabled
        if (this.recordingOptions.enabled && this.recordingService) {
            await this.recordingService.saveRecording({
                prompt,
                options,
                response: {
                    type: 'chat',
                    data: responseData,
                },
                inputTokens,
                outputTokens,
                requestId: options.requestId || '',
            });
        }

        return responseData;
    }

    /**
     * Calculate request cost for text generation based on total tokens.
     */
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
            if (
                status === 400 ||
                status === 401 ||
                status === 402 ||
                status === 403 ||
                status === 404 ||
                status === 409
            ) {
                return true;
            }
        }

        // Check error message for specific patterns
        if (error.message) {
            const message = error.message.toLowerCase();

            // Authentication/authorization errors
            if (
                message.includes('unauthorized') ||
                message.includes('forbidden') ||
                message.includes('authentication') ||
                message.includes('invalid credentials') ||
                message.includes('access denied') ||
                message.includes('api key') ||
                message.includes('invalid api key')
            ) {
                return true;
            }

            // Payment/billing errors
            if (
                message.includes('payment required') ||
                message.includes('insufficient funds') ||
                message.includes('billing') ||
                message.includes('quota exceeded') ||
                message.includes('limit exceeded')
            ) {
                return true;
            }

            // Client configuration errors
            if (
                message.includes('invalid request') ||
                message.includes('bad request') ||
                message.includes('malformed') ||
                message.includes('folder id') ||
                message.includes('model not found')
            ) {
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
        if (
            error.name === 'ValidationError' ||
            error.name === 'AuthenticationError' ||
            error.name === 'AuthorizationError'
        ) {
            return true;
        }

        return false;
    }

    /**
     * Returns API key, creating it once per application lifetime if necessary.
     */
    private async obtainApiKey(): Promise<string> {
        if (this.apiKey) {
            return this.apiKey;
        }

        if (YaGptService.cachedApiKey) {
            this.apiKey = YaGptService.cachedApiKey;
            return this.apiKey;
        }

        // Create new API key via IAM API
        const iamToken = process.env.YAGPT_IAM_TOKEN!;
        const serviceAccountId = process.env.YAGPT_SERVICE_ACCOUNT_ID!;

        const res = await fetch('https://iam.api.cloud.yandex.net/iam/v1/apiKeys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${iamToken}`,
            },
            body: JSON.stringify({ serviceAccountId }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to create Yandex GPT API key: ${res.status} - ${text}`);
        }

        const data = await res.json();
        const createdKey = data?.secret;

        if (!createdKey) {
            throw new Error('No api key returned from IAM service');
        }

        // Cache for future use
        YaGptService.cachedApiKey = createdKey;
        this.apiKey = createdKey;
        return createdKey;
    }

    async generateImage(
        prompt: string,
        options: { presentationId?: string; userId: string; requestId: string; __retryCount?: number }
    ): Promise<{ imageUrl: string; imageId: string }> {
        const startTime = Date.now();

        // Initialize retry counter if not provided
        const retryCount = options.__retryCount || 0;
        const maxRetries = 3;

        let cached = false;

        // Attempt to return cached image first (replay mode)
        if (this.recordingOptions.replayMode && this.recordingService) {
            const cachedRec = await this.recordingService.findRecording(prompt);
            if (cachedRec && cachedRec.response.type === 'image') {
                cached = true;
                return cachedRec.response.data as { imageUrl: string; imageId: string };
            }
        }

        const iamToken = process.env.YAGPT_IAM_TOKEN;
        if (!iamToken) {
            throw new Error('YAGPT_IAM_TOKEN is required for image generation');
        }

        const requestBody = {
            modelUri: `art://${this.folderId}/yandex-art/latest`,
            generationOptions: {
                seed: Math.floor(Math.random() * 10000).toString(),
            },
            messages: [
                {
                    weight: '1',
                    text: prompt,
                },
            ],
        };

        // Start async generation
        let startResp;
        try {
            startResp = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/imageGenerationAsync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${iamToken}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!startResp.ok) {
                const text = await startResp.text();
                const error = new Error(`Yandex Art start failed: ${startResp.status} - ${text}`);
                (error as any).status = startResp.status;
                throw error;
            }
        } catch (error: any) {
            logger.error('YaGPT generateImage: API error', { error, retryCount });

            // Check if this error should not be retried
            if (this.shouldNotRetry(error)) {
                throw error;
            }

            // Check if we've exceeded max retries
            if (retryCount >= maxRetries) {
                logger.error(`YaGPT Image: Max retries (${maxRetries}) exceeded for request ${options.requestId}`);
                throw error;
            }

            // Wait before retry (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
            logger.info(
                `YaGPT Image: Retrying request ${options.requestId} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`
            );
            await new Promise(resolve => setTimeout(resolve, delay));

            // Retry with incremented counter
            return await this.generateImage(prompt, {
                ...options,
                __retryCount: retryCount + 1,
            });
        }

        const startData = await startResp.json();
        const operationId = startData.id;
        if (!operationId) {
            throw new Error('No operation id returned from Yandex Art');
        }

        // Poll operation status (max 30 attempts, 2s interval)
        let attempts = 0;
        const maxAttempts = 30;
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        let imageBase64: string | undefined;
        while (attempts < maxAttempts) {
            await delay(2000);
            attempts += 1;

            const statusResp = await fetch(`https://llm.api.cloud.yandex.net/operations/${operationId}`, {
                headers: {
                    Authorization: `Bearer ${iamToken}`,
                },
            });

            if (!statusResp.ok) continue;
            const statusData = await statusResp.json();
            if (statusData.done) {
                imageBase64 = statusData.response?.image;
                break;
            }
        }

        if (!imageBase64) {
            throw new Error('Image generation did not complete in time');
        }

        // Save image
        const imageId = operationId;
        let imageUrl: string;
        if (typeof window === 'undefined') {
            const buffer = Buffer.from(imageBase64, 'base64');
            const path = await import('path');
            const fs = await import('fs/promises');
            const { getUploadPath } = await import('@/utils/uploadPath');
            const UPLOAD_DIR = getUploadPath();
            await fs.mkdir(UPLOAD_DIR, { recursive: true });
            const filePath = path.join(UPLOAD_DIR, `${imageId}.jpg`);
            await fs.writeFile(filePath, buffer, 'binary');
            imageUrl = `/uploads/${imageId}.jpg`;
        } else {
            imageUrl = `data:image/jpeg;base64,${imageBase64}`;
        }

        const result = { imageUrl, imageId };

        // ------------------------------------------------------------------
        //  Logging (only for non-cached requests)
        // ------------------------------------------------------------------

        if (!cached) {
            const duration = Date.now() - startTime;

            const logMessage: LLMRequestData = {
                userId: this.userId,
                provider: 'yagpt',
                presentationId: options.presentationId,
                requestId: options.requestId,
                requestType: 'generate_image',
                prompt,
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                duration,
                cached: false,
                cost: IMAGE_GENERATION_COST,
                success: true,
                errorMessage: undefined,
                metadata: {
                    provider: 'yagpt',
                    retryCount,
                },
            };

            await LLMHistoryService.logRequest(logMessage);
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

        return result;
    }
}

export default YaGptService;
