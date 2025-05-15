import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { createSlideFromTemplateWithContent } from '@/utils/createSlideFromTemplateWithContent';
import generateSlideContent from './generateSlideContent';
import { LLMRequestContext } from '@/types/gigachat';

if (!process.env.GIGACHAT_API_KEY || !process.env.GIGACHAT_AUTH_KEY || !process.env.GIGACHAT_SCOPE) {
    throw new Error('GIGACHAT_API_KEY, GIGACHAT_AUTH_KEY, and GIGACHAT_SCOPE environment variables are not set');
}

export default async function generateSlide({
    topic,
    index,
    totalSlides,
    templateId,
    instructions,
    options,
}: {
    topic: string;
    index: number;
    totalSlides: number;
    templateId: string;
    instructions: string;
    options: LLMRequestContext;
}) {
    const template = SlideTemplatesRegistry[templateId];

    const { functionArgs, slotMapping } = await generateSlideContent({
        topic,
        slideIndex: index,
        totalSlides,
        template,
        instructions,
        options,
    });

    // const { functionSchema, slotMapping } = createGenerateSlideContentFunction(template);

    // // создаем промпт для генерации слайда
    // const prompt = createPromptGenerateSlideContent(topic, index + 1, totalSlides, template, slotMapping, instructions);
    // console.log(prompt);

    // // получаем ответ от LLM
    // // const response = await gigaChatService.generateFromCache(topic);
    // const response = await gigaChatService.generate(prompt, {
    //     functions: [functionSchema],
    //     function_call: { name: 'generate_slide_text' },
    // });

    // const functionArgs = response.function_call?.arguments;

    // создаем слайд из шаблона и аргументов
    const slide = await createSlideFromTemplateWithContent({
        templateId: template.id,
        slotMapping,
        layoutsContents: functionArgs,
        title: topic,
        options,
    });

    return slide;
}
