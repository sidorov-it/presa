import { LLMResponse, LLMService, YaGptConfig } from '@/types/llm';
import { RateLimiter } from '../rateLimiter';
import { LLMHistoryService, LLMRequestData } from '../history/llmHistoryService';

interface YaGPTMessage {
    role: 'system' | 'user' | 'assistant';
    text: string;
}

export class YaGptService implements LLMService {
    private static rateLimiter = new RateLimiter(10);
    private readonly iamToken: string;
    private readonly folderId: string;
    private readonly userId: string;

    constructor(config: YaGptConfig) {
        if (!process.env.YAGPT_IAM_TOKEN || !process.env.YAGPT_FOLDER_ID) {
            throw new Error('YAGPT_IAM_TOKEN and YAGPT_FOLDER_ID environment variables are required');
        }

        this.iamToken = process.env.YAGPT_IAM_TOKEN;
        this.folderId = process.env.YAGPT_FOLDER_ID;
        this.userId = config.userId;
    }

    static createYaGptService(config: YaGptConfig) {
        return new YaGptService(config);
    }

    private async withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
        return YaGptService.rateLimiter.run(fn);
    }

    private buildRequestBody(prompt: string): Record<string, unknown> {
        const messages: YaGPTMessage[] = [
            {
                role: 'system',
                text: 'Ты профессиональный создатель презентаций. Твоя задача — генерировать контент для слайдов презентации. Предоставляй контент в четком, структурированном формате, который можно легко анализировать.',
            },
            { role: 'user', text: prompt },
        ];

        return {
            modelUri: `gpt://${this.folderId}/yandexgpt/latest`,
            completionOptions: {
                stream: false,
                temperature: 0.4,
                maxTokens: 2048,
            },
            messages,
        };
    }

    async generate(
        prompt: string,
        options: { presentationId?: string; functions?: any[]; function_call?: any } = {}
    ): Promise<LLMResponse> {
        const start = Date.now();

        const endpoint = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
        const body = this.buildRequestBody(prompt);

        const responseJson = await this.withRateLimit(async () => {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.iamToken}`,
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`YaGPT API error: ${res.status} - ${text}`);
            }

            return res.json();
        });

        // Yandex GPT returns choices array similar to OpenAI
        const textResponse: string =
            responseJson.choices?.[0]?.message?.text || responseJson.choices?.[0]?.text || '';

        const elements = textResponse
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

        return { elements };
    }
}

export default YaGptService; 