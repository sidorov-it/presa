/* eslint-disable prettier/prettier */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateId } from '@/utils/id';
import { stringifyJsonField } from '@/utils/json';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { generateSlidesTemplates } from '@/services/llm/gigaChat';
import generateSlide from '@/services/llm/gigaChat/generateSlide';
import { withTokenDeduction, TokenCalculators, MetadataExtractors } from '@/utils/aiTokenMiddleware';

export async function POST(request: NextRequest) {
    return withTokenDeduction(
        request,
        {
            operation: 'GENERATE_SLIDE',
            description: 'Generate presentation slides',
            calculateTokens: TokenCalculators.generateSlides,
            metadata: MetadataExtractors.presentation,
        },
        async (session, requestData) => {
            const { title, prompt, topics } = requestData;

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
                    options: {
                        userId,
                    },
                });

                // Generate slides using AI
                const slides = [];
                for (let i = 0; i < templateSuggestions.length; i++) {
                    const template = SlideTemplatesRegistry[templateSuggestions[i].templateId];
                    if (!template) {
                        throw new Error(`Template not found: ${templateSuggestions[i].templateId}`);
                    }

                    const slide = await generateSlide({
                        topic: title,
                        index: i,
                        totalSlides: templateSuggestions.length,
                        templateId: template.id,
                        instructions: topics[i]?.instructions || '',
                        options: {
                            userId,
                        },
                    });
                    slides.push(slide);
                }

                // Create presentation in database
                const presentation = await prisma.presentation.create({
                    data: {
                        title: title || 'AI Generated Presentation',
                        description: prompt?.substring(0, 500) || '',
                        slides: stringifyJsonField(slides),
                        userId,
                    },
                });

                return {
                    presentation: {
                        ...presentation,
                        slides: slides,
                    },
                };
            } catch (templateError) {
                console.error('Error selecting templates:', templateError);
                
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
                        slides: stringifyJsonField(slidesData),
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
