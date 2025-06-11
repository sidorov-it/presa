import { NextRequest } from 'next/server';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import generateSlidesTemplates from '@/services/llm/gigaChat/generateSlidesTemplates';
import { prisma } from '@/lib/prisma';
import extractTextsFromPresentation from '@/utils/extractTextsFromPresentation';
import { IPresentation } from '@/types';
import generateSlide from '@/services/llm/gigaChat/generateSlide';
import { withTokenDeduction, TokenCalculators, MetadataExtractors } from '@/utils/aiTokenMiddleware';

interface RequestBody {
    presentationId: string;
    slideIndex: number;
    prompt: string;
    templateId: string;
    surroundingSlides: {
        title: string;
        content: string;
    }[];
}

export async function POST(request: NextRequest) {
    return withTokenDeduction(
        request,
        {
            operation: 'GENERATE_SLIDE',
            description: 'Generate single slide',
            calculateTokens: TokenCalculators.generateSingleSlide,
            metadata: MetadataExtractors.slide,
        },
        async (session, requestData: RequestBody) => {
            const { prompt, templateId, slideIndex, presentationId } = requestData;

            const presentation = await prisma.presentation.findUnique({
                where: { id: presentationId },
            });

            if (!presentation) {
                throw new Error('Presentation not found');
            }

            const slideTexts = extractTextsFromPresentation(presentation as unknown as IPresentation);
            const surroundingSlides = slideTexts.slice(Math.max(0, slideIndex - 2), slideIndex + 2);

            // If templateId is 'auto', we need to select the best template using LLM
            let finalTemplateId = templateId;

            if (templateId === 'auto') {
                // Generate template suggestions based on the prompt and surrounding slides
                const templateSuggestions = await generateSlidesTemplates({
                    title: surroundingSlides[0]?.text || '',
                    prompt,
                    topics: surroundingSlides.map(slide => ({ title: slide.text })),
                    options: {
                        userId: session.user.id,
                        presentationId,
                    },
                });

                // Use the first suggested template or fallback to a default one
                finalTemplateId = templateSuggestions[0]?.templateId || 'title-bullets';
            }

            // Validate that the template exists
            const template = SlideTemplatesRegistry[finalTemplateId];
            if (!template) {
                throw new Error('Template not found');
            }

            const instructions =
                surroundingSlides[0]?.text || surroundingSlides[1]?.text
                    ? `Учитывай контент соседних слайдов:
${surroundingSlides[0]?.text ? `Текст предыдущего слайда: ${surroundingSlides[0]?.text}` : ''}
${surroundingSlides[1]?.text ? `Текст следующего слайда: ${surroundingSlides[1]?.text}` : ''}
    `
                    : '';

            const slide = await generateSlide({
                topic: prompt,
                index: slideIndex,
                totalSlides: presentation.slides.length,
                templateId: template.id,
                instructions,
                options: {
                    userId: session.user.id,
                    presentationId,
                },
            });

            return { slide };
        }
    );
}
