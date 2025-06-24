import { LLMResponse, LLMService, YaGptConfig } from '@/types/llm';
import { RateLimiter } from '../rateLimiter';
import { LLMHistoryService, LLMRequestData } from '../history/llmHistoryService';
import { RecordingOptions } from '@/types/llm/recordings';
import { RecordingService } from '../recordings/recordingService';
import { replyConfig } from '../gigaChat/replyConfig';
import { SYSTEM_PROMPT } from '@/prompts';

interface YaGPTMessage {
    role: 'system' | 'user' | 'assistant';
    text: string;
}

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
        } = {}
    ): Promise<LLMResponse> {
        const start = Date.now();

        // ------------------------------------------------------------------
        //  RecordingService replay mode: return cached response if available
        // ------------------------------------------------------------------
        if (this.recordingOptions.replayMode && this.recordingService) {
            const cachedRecording = await this.recordingService.findRecording(prompt, options);
            if (cachedRecording && cachedRecording.response.type === 'chat') {
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

        const responseJson = await this.withRateLimit(async () => {
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
                throw new Error(`YaGPT API error: ${res.status} - ${text}`);
            }

            return res.json();
        });

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
            const tool = message.toolCallList.toolCalls[0];
            functionCall = {
                name: tool.functionCall?.name,
                arguments: tool.functionCall?.arguments,
            };
        } else if (message?.function_call) {
            functionCall = {
                name: message.function_call.name,
                arguments: message.function_call.arguments,
            };
        } else {
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

        const duration = Date.now() - start;

        // Attempt to read token information if provided (YaGPT may not provide it)
        const totalTokens: number = responseJson.usage?.total_tokens ?? 0;
        const inputTokens: number = responseJson.usage?.prompt_tokens ?? 0;
        const outputTokens: number = responseJson.usage?.completion_tokens ?? 0;

        const logData: LLMRequestData = {
            userId: this.userId,
            presentationId: options.presentationId,
            requestType: 'generate_content',
            prompt,
            inputTokens,
            outputTokens,
            totalTokens,
            duration,
            cached: false,
            cost: 0, // cost calculation for YaGPT not implemented
            success: true,
            errorMessage: undefined,
            metadata: {
                provider: 'yagpt',
            },
        };

        await LLMHistoryService.logRequest(logData);

        // Check if function call is required but absent
        if (requireFunctionCall && !functionCall) {
            if (__attemptCount >= 2) {
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

            return this.generate(retryPrompt, {
                ...chatOptions,
                requireFunctionCall: true,
                __attemptCount: __attemptCount + 1,
            });
        }

        const responseData: LLMResponse = {
            elements,
            ...(functionCall ? { function_call: functionCall } : {}),
        };

        // Save recording if enabled
        if (this.recordingOptions.enabled && this.recordingService) {
            await this.recordingService.saveRecording({
                prompt,
                options,
                response: {
                    type: 'chat',
                    data: responseData,
                },
            });
        }

        return responseData;
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

    async generateImage(prompt: string): Promise<{ imageUrl: string; imageId: string }> {
        // Attempt to return cached image first (replay mode)
        if (this.recordingOptions.replayMode && this.recordingService) {
            const cachedRec = await this.recordingService.findRecording(prompt);
            if (cachedRec && cachedRec.response.type === 'image') {
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
        const startResp = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/imageGenerationAsync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${iamToken}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!startResp.ok) {
            const text = await startResp.text();
            throw new Error(`Yandex Art start failed: ${startResp.status} - ${text}`);
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
            const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
            await fs.mkdir(UPLOAD_DIR, { recursive: true });
            const filePath = path.join(UPLOAD_DIR, `${imageId}.jpg`);
            await fs.writeFile(filePath, buffer, 'binary');
            imageUrl = `/uploads/${imageId}.jpg`;
        } else {
            imageUrl = `data:image/jpeg;base64,${imageBase64}`;
        }

        const result = { imageUrl, imageId };

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

        return result;
    }
}

export default YaGptService;
