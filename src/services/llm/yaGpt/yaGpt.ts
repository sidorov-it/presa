import { LLMResponse, LLMService, YaGptConfig } from '@/types/llm';
import { RateLimiter } from '../rateLimiter';
import { LLMHistoryService, LLMRequestData } from '../history/llmHistoryService';

interface YaGPTMessage {
    role: 'system' | 'user' | 'assistant';
    text: string;
}

export class YaGptService implements LLMService {
    private static rateLimiter = new RateLimiter(10);
    private readonly apiKey: string;
    private readonly folderId: string;
    private readonly userId: string;
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
                text: 'Ты профессиональный создатель презентаций. Твоя задача — генерировать контент для слайдов презентации. Предоставляй контент в четком, структурированном формате, который можно легко анализировать.',
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
        options: { presentationId?: string; functions?: any[]; function_call?: any } = {}
    ): Promise<LLMResponse> {
        const start = Date.now();

        const endpoint = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';

        // Ensure we have an API key ready
        const apiKey = process.env.YAGPT_IAM_TOKEN;

        const body = this.buildRequestBody(prompt, options);

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
        const message = firstAlt.message || yaResult.message || responseJson.message || responseJson.choices?.[0]?.message || responseJson.choices?.[0];

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

        return {
            elements,
            ...(functionCall ? { function_call: functionCall } : {}),
        };
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
}

export default YaGptService;
