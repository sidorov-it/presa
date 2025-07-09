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

export async function POST(request: NextRequest) {
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
            const { title, prompt, topics, durationMinutes, goal, audience, tone } = requestData;

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

                for (let i = 0; i < templateSuggestions.length; i++) {
                    const template = SlideTemplatesRegistry[templateSuggestions[i].templateId];
                    if (!template) {
                        throw new Error(`Template not found: ${templateSuggestions[i].templateId}`);
                    }

                    const previousSlidesContent = slides
                        .slice(Math.max(0, slides.length - 2))
                        .map(ps => ({ title: ps.title, content: extractSlidePlainText(ps) }));

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
                        previousSlides: previousSlidesContent,
                        options: {
                            userId,
                            requestId,
                        },
                    });
                    slides.push(slide);
                }

                const themes = await prisma.theme.findMany({
                    where: {
                        isActive: true,
                        isDefault: true,
                        userId,
                    },
                    select: {
                        id: true,
                    },
                });

                const ramdomTheme = themes[Math.floor(Math.random() * themes.length)];

                // Create presentation in database
                const presentation = await prisma.presentation.create({
                    data: {
                        title: title || 'AI Generated Presentation',
                        description: prompt?.substring(0, 500) || '',
                        slides: slides as any,
                        userId,
                        durationMinutes,
                        goal,
                        audience,
                        tone,
                        themeId: ramdomTheme.id,
                    },
                });

                return {
                    presentation: {
                        ...presentation,
                        slides: slides,
                    },
                };
            } catch (templateError) {
                logger.error(`Error selecting templates: ${templateError}`);

                // Fallback to basic slides if template selection fails
                const slidesData = topics.map((topic: any) => ({
                    id: `slide-${generateId()}`,
                    title: topic.title || topic,
                    layouts: [
                        {
                            id: `layout-${generateId()}`,
                            type: 'blank',
                            elements: [
                                {
                                    id: `element-${generateId()}`,
                                    type: 'editor',
                                    content: topic.title || topic,
                                    cellId: `cell-${generateId()}`,
                                },
                            ],
                            style: {},
                            gridStructure: {
                                rows: [
                                    {
                                        id: generateId(),
                                        cells: [
                                            {
                                                id: `cell-${generateId()}`,
                                                row: 0,
                                                column: 0,
                                            },
                                        ],
                                    },
                                ],
                                columns: 1,
                                columnWidths: ['100%'],
                            },
                        },
                    ],
                    contentAlignment: 'center',
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
                    },
                });

                return {
                    presentation: {
                        ...presentation,
                        slides: slidesData,
                    },
                };
            }
        }
    );
}
