import { SupportedLLMProvider, LLMService } from '@/types/llm';
import { GigaChatService } from './gigaChat/gigaChat';
import { YaGptService } from './yaGpt/yaGpt';
import { MockGptService } from './mockGpt/mockGpt';
import { getTestScenarioFromEnv } from './mockGpt/testUtils';

interface CreateServiceOptions {
    userId: string;
    provider?: SupportedLLMProvider;
    testScenario?: string;
}

export function createLLMService({ userId, provider, testScenario }: CreateServiceOptions): LLMService {
    const selectedProvider: SupportedLLMProvider =
        provider || (process.env.LLM_PROVIDER as SupportedLLMProvider) || 'gigachat';

    switch (selectedProvider) {
        case 'gigachat':
            return new GigaChatService({ userId });
        case 'yagpt':
            return new YaGptService({ userId });
        case 'mock':
            // Use provided testScenario or fallback to environment variable
            const scenarioToUse = testScenario || getTestScenarioFromEnv();
            return new MockGptService({ userId, testScenario: scenarioToUse });
        default:
            throw new Error(`Unsupported LLM provider: ${selectedProvider}`);
    }
}
