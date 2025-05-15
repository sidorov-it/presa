import { LLMRequestContext } from '@/types/gigachat';
import { GigaChatService } from './gigaChat';

export default async function generateImage(prompt: string, context: LLMRequestContext) {
    const gigaChatService = GigaChatService.createGigaChatService({ userId: context.userId });
    const { imageUrl } = await gigaChatService.generateImage(prompt, context);

    return imageUrl;
}
