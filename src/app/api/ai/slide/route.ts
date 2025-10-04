import { withLogging } from '@/hooks/withLoging';
import { NextRequest } from 'next/server';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import generateSlideTemplate from '@/services/llm/generateSlideTemplate';
import { prisma } from '@/lib/prisma';
import extractTextsFromPresentation from '@/utils/extractTextsFromPresentation';
import { IPresentation } from '@/types';
import generateSlide from '@/services/llm/generateSlide';
import { withTokenDeduction, TokenCalculators, MetadataExtractors } from '@/utils/aiTokenMiddleware';
import logger from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface RequestBody {
    presentationId: string;
    slideIndex: number;
    prompt: string;
    templateId: string;
    durationMinutes?: number;
    goal?: string;
    audience?: string;
    tone?: string;
    surroundingSlides?: {
        title: string;
        content: string;
    }[];
}

async function POSTHandler(request: NextRequest) {
    logger.info('POST /api/ai/slide');
    const requestId = uuidv4();
    return withTokenDeduction(
        request,
        {
            operation: 'GENERATE_SLIDE',
            description: 'Generate single slide',
            calculateTokens: TokenCalculators.generateSingleSlide,
            metadata: MetadataExtractors.slide,
        },
        async (session, requestData: RequestBody) => {
            const {
                prompt,
                templateId,
                slideIndex,
                presentationId,
                durationMinutes: reqDuration,
                goal: reqGoal,
                audience: reqAudience,
                tone: reqTone,
            } = requestData;

            const presentation = await prisma.presentation.findUnique({
                where: { id: presentationId },
            });

            if (!presentation) {
                throw new Error('Presentation not found');
            }

            const slideTexts = extractTextsFromPresentation(presentation as unknown as IPresentation);
            const surroundingSlides = slideTexts.slice(Math.max(0, slideIndex - 2), slideIndex + 2);

            // Prepare updated metadata if values differ
            const updateData: Record<string, any> = {};
            if (typeof reqDuration === 'number' && reqDuration !== (presentation as any).durationMinutes) {
                updateData.durationMinutes = reqDuration;
            }
            if (typeof reqGoal === 'string' && reqGoal !== (presentation as any).goal) {
                updateData.goal = reqGoal;
            }
            if (typeof reqAudience === 'string' && reqAudience !== (presentation as any).audience) {
                updateData.audience = reqAudience;
            }
            if (typeof reqTone === 'string' && reqTone !== (presentation as any).tone) {
                updateData.tone = reqTone;
            }

            if (Object.keys(updateData).length > 0) {
                await prisma.presentation.update({
                    where: { id: presentationId },
                    data: updateData,
                });
                Object.assign(presentation, updateData);
            }

            // If templateId is 'auto', we need to select the best template using LLM
            let finalTemplateId = templateId;

            if (templateId === 'auto') {
                // Select the best template for a single slide using the dedicated LLM helper
                const { templateId: suggestedTemplateId } = await generateSlideTemplate({
                    prompt,
                    surroundingSlides: surroundingSlides.map(s => ({ content: s.text })),
                    durationMinutes: (presentation as any).durationMinutes,
                    goal: (presentation as any).goal,
                    audience: (presentation as any).audience,
                    tone: (presentation as any).tone,
                    options: {
                        userId: session.user.id,
                        presentationId,
                        requestId,
                    },
                });

                finalTemplateId = suggestedTemplateId || 'title-bullets';
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
                durationMinutes: (presentation as any).durationMinutes,
                goal: (presentation as any).goal,
                audience: (presentation as any).audience,
                tone: (presentation as any).tone,
                options: {
                    userId: session.user.id,
                    presentationId,
                    requestId,
                },
            });

            return { slide };
        },
        requestId
    );
}
export const POST = withLogging(POSTHandler);
