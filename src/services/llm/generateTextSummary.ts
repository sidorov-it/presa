import { LLMRequestContext } from '@/types/gigachat';
import { createLLMService } from './providerFactory';

const getPrompt = (text: string) => {
    return `
Создайте сжатое и структурированное саммари следующего текста, которое можно использовать для разработки структуры презентации. Саммари должно включать основные идеи и ключевые моменты, выделяя главные тезисы и важные аспекты. Убедитесь, что саммари охватывает все важные детали, сохраняя логическую последовательность изложения. Разделите текст на несколько основных разделов, каждый из которых должен быть четко обозначен и содержать основную информацию. Используйте краткие и четкие формулировки, чтобы облегчить восприятие материала при презентации.

Текст:
    ${text}
    `;
};

export default async function generateTextSummary({ text, options }: { text: string; options: LLMRequestContext }) {
    const llmService = createLLMService({ userId: options.userId });

    const summary = await llmService.generate(getPrompt(text));

    return summary;
}
