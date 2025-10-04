import { withLogging } from '@/hooks/withLoging';
import { NextRequest } from 'next/server';
import { withTokenDeduction, TokenCalculators } from '@/utils/aiTokenMiddleware';
import { generateTopicsWithContent } from '@/services/llm/generateTopicsWithContent';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import logger from '@/utils/logger';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { getUserFeatures } from '@/utils/subscriptions';
import generateSlidesTemplates from '@/services/llm/generateSlidesTemplates';
import generateSlide from '@/services/llm/generateSlide';
import { generateId } from '@/utils/id';

async function POSTHandler(request: NextRequest) {
    logger.info('POST /api/ai/document/create');
    const requestId = uuidv4();
    return withTokenDeduction(
        request,
        {
            operation: 'GENERATE_PRESENTATION_FROM_DOCUMENT',
            description: 'Generate presentation from document',
            calculateTokens: TokenCalculators.generatePresentationFromDocument,
        },
        async (session, requestData) => {
            const { extractedText, filename, numSlides, tone, contentAmount, durationMinutes, goal, audience } =
                requestData;

            if (!extractedText || !filename) {
                throw new Error('Invalid request data: extractedText and filename are required');
            }

            const userId = session.user.id;

            // Check user's subscription features and apply slide limits
            const userFeatures = await getUserFeatures(userId);
            const maxSlides = userFeatures.maxSlides;

            if (numSlides > maxSlides) {
                throw new Error(
                    `Slide limit exceeded. Your current plan allows up to ${maxSlides} slides. Requested: ${numSlides}`
                );
            }

            try {
                logger.info(`Starting document-based presentation generation for user ${userId}`);
                logger.info(`Document: ${filename}, Content length: ${extractedText.length} chars`);
                logger.info(`User slide limit: ${maxSlides}, Requested slides: ${numSlides}`);

                // First, generate topics from the document using full content
                const { title, topics } = await generateTopicsWithContent(
                    userId,
                    {
                        content: extractedText, // Use full content, not truncated
                        numSlides,
                        contentAmount,
                    },
                    requestId
                );

                const templateSuggestions = await generateSlidesTemplates({
                    title,
                    prompt: extractedText,
                    topics: topics.map(t => ({
                        title: t.title,
                        instructions: `Контент для этого слайда: ${t.content}`,
                    })),
                    contentAmount,
                    durationMinutes,
                    options: {
                        userId,
                        requestId,
                    },
                });

                logger.info(`Generated ${templateSuggestions.length} template suggestions`);

                // Generate slides using AI
                const slides = [];

                for (let i = 0; i < topics.length; i++) {
                    const topic = topics[i];
                    const template = SlideTemplatesRegistry[templateSuggestions[i].templateId];
                    if (!template) {
                        throw new Error(`Template not found: ${templateSuggestions[i].templateId}`);
                    }
                    logger.info(`Generating slide ${i + 1} with template: ${template.id}`);

                    const previousSlide = topics[i - 1];
                    const nextSlide = topics[i + 1];

                    const surroundingSlides = [previousSlide, nextSlide].filter(Boolean);
                    const slide = await generateSlide({
                        topic: title,
                        index: i,
                        totalSlides: templateSuggestions.length,
                        templateId: template.id,
                        instructions: `Создай контент для слайда "${topic.title}", используя следующий контент: ${topic.content}`,
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

                const themesIds = await prisma.theme.findMany({
                    select: {
                        id: true,
                    },
                    where: {
                        OR: [
                            {
                                isDefault: true,
                            },
                            {
                                userId,
                            },
                        ],
                        AND: {
                            isActive: true,
                        },
                    },
                });

                const theme = themesIds[Math.floor(Math.random() * themesIds.length)];

                const presentation = await prisma.presentation.create({
                    data: {
                        title: title || 'AI Generated Presentation',
                        // description: prompt?.substring(0, 500) || '',
                        userId,
                        slides: slidesData,
                        durationMinutes,
                        goal,
                        audience,
                        tone,
                        contentAmount,
                        themeId: theme.id,
                    },
                });

                return {
                    presentation: {
                        ...presentation,
                        slides: slidesData,
                    },
                };

                // return NextResponse.json(dataa);
            } catch (error) {
                logger.error('Error generating presentation from document:', error);
                throw error;
            }
        },
        requestId
    );
}

export const POST = withLogging(POSTHandler);
