import { withLogging } from '@/hooks/withLoging';
/* eslint-disable prettier/prettier */
import logger from '@/utils/logger';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateId } from '@/utils/id';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { generateSlidesTemplates } from '@/services/llm/gigaChat';
import generateSlide from '@/services/llm/generateSlide';
import { withTokenDeduction, TokenCalculators, MetadataExtractors } from '@/utils/aiTokenMiddleware';
import extractTextFromElement from '@/utils/extractTextFromElement';
import { v4 as uuidv4 } from 'uuid';

async function POSTHandler(request: NextRequest) {
    const requestId = uuidv4();
    return withTokenDeduction(
        request,
        {
            operation: 'GENERATE_SLIDE',
            description: 'Generate presentation slides',
            calculateTokens: TokenCalculators.generateSlides,
            metadata: MetadataExtractors.presentation,
        },
        async (session, requestData) => {
            const { title, prompt, topics, durationMinutes, goal, audience, tone, contentAmount } = requestData;

            if (!prompt || !topics || !Array.isArray(topics)) {
                throw new Error('Invalid request data: prompt and topics are required');
            }

            const userId = session.user.id;

            try {
                // Generate template suggestions for all slides
                const templateSuggestions = await generateSlidesTemplates({
                    title,
                    prompt,
                    topics,
                    durationMinutes,
                    goal,
                    audience,
                    tone,
                    contentAmount,
                    options: {
                        userId,
                        requestId,
                    },
                });

                // Generate slides using AI
                const slides = [];
                const extractSlidePlainText = (slide: any) =>
                    (slide.layouts || [])
                        .flatMap((layout: any) => layout.elements)
                        .map((el: any) => extractTextFromElement(el as any))
                        .join('\n');

                for (let i = 0; i < topics.length; i++) {
                    const topic = topics[i];
                    const template = SlideTemplatesRegistry[templateSuggestions[i].templateId];
                    if (!template) {
                        throw new Error(`Template not found: ${templateSuggestions[i].templateId}`);
                    }
                    logger.info(`Generating slide ${i + 1} with template: ${template.id}`);

                    // Get surrounding slides for context
                    const surroundingSlides = slides
                        .slice(Math.max(0, i - 2), i)
                        .map((slide: any) => ({
                            title: slide.title || '',
                            content: extractSlidePlainText(slide),
                        }));

                    const slide = await generateSlide({
                        topic: title,
                        index: i,
                        totalSlides: templateSuggestions.length,
                        templateId: template.id,
                        instructions: topics[i]?.instructions || '',
                        durationMinutes,
                        goal,
                        audience,
                        tone,
                        previousSlides: surroundingSlides,
                        options: {
                            userId,
                            requestId,
                        },
                    });                    // Set slide title from topic
                    slide.title = topic.title;
                    slides.push(slide);

                    logger.info(`Generated slide ${i + 1}/${topics.length}`);
                }

                // Create presentation in database
                const slidesData = slides.map((slide: any, index: number) => ({
                    ...slide,
                    id: generateId(),
                    index,
                    hidden: false,
                }));

                const presentation = await prisma.presentation.create({
                    data: {
                        title: title || 'AI Generated Presentation',
                        description: prompt?.substring(0, 500) || '',
                        userId,
                        slides: slidesData,
                        durationMinutes,
                        goal,
                        audience,
                        tone,
                        contentAmount,
                    },
                });

                return {
                    presentation: {
                        ...presentation,
                        slides: slidesData,
                    },
                };
            } catch (error) {
                logger.error('Error generating presentation:', error);
                throw error;
            }
        }
    );
}

export const POST = withLogging(POSTHandler);
