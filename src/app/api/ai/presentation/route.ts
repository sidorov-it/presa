import { withLogging } from '@/hooks/withLoging';
import { NextRequest } from 'next/server';
import { withTokenDeduction, TokenCalculators } from '@/utils/aiTokenMiddleware';
import generateSlidesTemplates from '@/services/llm/generateSlidesTemplates';
import generateSlide from '@/services/llm/generateSlide';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { generateId } from '@/utils/id';
import logger from '@/utils/logger';
import { prisma } from '@/lib/prisma';
// import { extractTextFromElement } from '@/utils/textExtraction';
import { v4 as uuidv4 } from 'uuid';
import { getUserFeatures, performSubscriptionHealthCheck } from '@/utils/subscriptions';
import extractTextFromElement from '@/utils/extractTextFromElement';

async function POSTHandler(request: NextRequest) {
    logger.info('POST /api/ai/presentation');
    const requestId = uuidv4();
    return withTokenDeduction(
        request,
        {
            operation: 'GENERATE_PRESENTATION',
            description: 'Generate presentation slides from topics',
            calculateTokens: TokenCalculators.generateSlides,
        },
        async (session, requestData) => {
            const { title, prompt, topics, durationMinutes, goal, audience, tone, contentAmount } = requestData;

            if (!prompt || !topics || !Array.isArray(topics)) {
                throw new Error('Invalid request data: prompt and topics are required');
            }

            const userId = session.user.id;

            // Perform subscription health check and get current features
            await performSubscriptionHealthCheck(userId);
            const userFeatures = await getUserFeatures(userId);
            const maxSlides = userFeatures.maxSlides;

            if (topics.length > maxSlides) {
                throw new Error(
                    `Slide limit exceeded. Your current plan allows up to ${maxSlides} slides. Requested: ${topics.length}`
                );
            }

            try {
                logger.info(`Starting presentation generation for user ${userId}`);
                logger.info(`User slide limit: ${maxSlides}, Requested slides: ${topics.length}`);

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
                    const surroundingSlides = slides.slice(Math.max(0, i - 2), i).map((slide: any) => ({
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
                    });

                    // Set slide title from topic
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
                        title,
                        slides: slidesData,
                        userId: session.user.id,
                        durationMinutes,
                        goal,
                        audience,
                        tone,
                    },
                });

                logger.info(`Created presentation ${presentation.id} with ${slidesData.length} slides`);

                return {
                    presentationId: presentation.id,
                    title: presentation.title,
                    slidesCount: slidesData.length,
                    userLimits: {
                        maxSlides,
                        usedSlides: topics.length,
                        hasSubscription: userFeatures.maxSlides > 10, // Default is 10
                    },
                };
            } catch (error) {
                logger.error('Error generating presentation:', error);
                throw error;
            }
        },
        requestId
    );
}

export const POST = withLogging(POSTHandler);
