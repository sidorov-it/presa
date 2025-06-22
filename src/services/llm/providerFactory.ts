import { SupportedLLMProvider, LLMService } from '@/types/llm';
import { GigaChatService } from './gigaChat/gigaChat';
import { YaGptService } from './yaGpt/yaGpt';

interface CreateServiceOptions {
    userId: string;
    provider?: SupportedLLMProvider;
}

export function createLLMService({ userId, provider }: CreateServiceOptions): LLMService {
    const selectedProvider: SupportedLLMProvider =
        provider || (process.env.LLM_PROVIDER as SupportedLLMProvider) || 'gigachat';

    switch (selectedProvider) {
        case 'gigachat':
            return new GigaChatService({ userId });
        case 'yagpt':
            return new YaGptService({ userId });
        default:
            throw new Error(`Unsupported LLM provider: ${selectedProvider}`);
    }
}
