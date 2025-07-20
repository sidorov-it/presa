import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { createSlideFromTemplateWithContent } from '@/utils/createSlideFromTemplateWithContent';
import generateSlideContent from './generateSlideContent';
import { LLMRequestContext } from '@/types/gigachat';

export default async function generateSlide({
    topic,
    index,
    totalSlides,
    templateId,
    instructions,
    contentAmount,
    durationMinutes,
    goal,
    audience,
    tone,
    previousSlides,
    options,
}: {
    topic: string;
    index: number;
    totalSlides: number;
    templateId: string;
    instructions: string;
    contentAmount?: string;
    durationMinutes?: number;
    goal?: string;
    audience?: string;
    tone?: string;
    previousSlides?: { title?: string; content: string }[];
    options: LLMRequestContext;
}) {
    const template = SlideTemplatesRegistry[templateId];

    const { functionArgs, slotMapping } = await generateSlideContent({
        topic,
        slideIndex: index,
        totalSlides,
        template,
        instructions,
        contentAmount,
        durationMinutes,
        goal,
        audience,
        tone,
        previousSlides,
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
    console.log('functionArgs', functionArgs);
    const slide = await createSlideFromTemplateWithContent({
        templateId: template.id,
        slotMapping,
        layoutsContents: functionArgs,
        title: topic,
        options,
    });

    return slide;
}
