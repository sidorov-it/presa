import { LLMRequestContext } from '@/types/gigachat';
import { createLLMService } from '@/services/llm';

export default async function generateImage(prompt: string, context: LLMRequestContext) {
    const llmService = createLLMService({ userId: context.userId });
    if (!llmService.generateImage) {
        throw new Error('Selected LLM provider does not support image generation');
    }
    const { imageUrl } = await llmService.generateImage(prompt, context);

    return imageUrl;
}
