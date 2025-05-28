/* eslint-disable prettier/prettier */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateId } from '@/utils/id';
import { stringifyJsonField } from '@/utils/json';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { generateSlidesTemplates } from '@/services/llm/gigaChat';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import generateSlide from '@/services/llm/gigaChat/generateSlide';
import { hasEnoughTokens, deductTokens } from '@/utils/tokens';
import { getTokenCostForOperation } from '@/utils/getTokenCostForOperation';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        // const userId = '67ecfcff96c6214c66f2b6ef';
        const { title, prompt, topics } = await request.json();

        if (!prompt || !topics || !Array.isArray(topics)) {
            return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
        }

        // Calculate required tokens (per slide)
        const requiredTokens = topics.length * getTokenCostForOperation('GENERATE_SLIDE');

        // Check if user has enough tokens
        const hasTokens = await hasEnoughTokens(userId, requiredTokens);
        if (!hasTokens) {
            return NextResponse.json({
                error: 'Insufficient tokens',
                message: `You need ${requiredTokens} tokens to generate ${topics.length} slides. Please purchase more tokens to continue.`,
                requiredTokens,
                operation: 'GENERATE_SLIDE',
            }, { status: 402 });
        }

        try {
            const templateSuggestions = await generateSlidesTemplates({
                title,
                prompt,
                topics,
                options: {
                    userId,
                },
            });

            const slides = [];

            for (let i = 0; i < templateSuggestions.length; i++) {
                const template = SlideTemplatesRegistry[templateSuggestions[i].templateId];
                const slide = await generateSlide(
                    {
                        topic: title,
                        index: i,
                        totalSlides: templateSuggestions.length,
                        templateId: template.id,
                        instructions: topics[i].instructions,
                        options: {
                            userId,
                            // presentationId: '1',
                        },
                    }
                );
                slides.push(slide);
            }

            try {
                const presentation = await prisma.presentation.create({
                    data: {
                        title,
                        description: '',
                        slides: stringifyJsonField(slides),
                        userId,
                    },
                });

                // Deduct tokens after successful generation
                try {
                    await deductTokens({
                        userId,
                        amount: requiredTokens,
                        description: `Generated ${topics.length} slides for presentation "${title}"`,
                        metadata: {
                            presentationId: presentation.id,
                            slidesCount: topics.length,
                            prompt: prompt.substring(0, 100), // First 100 chars of prompt
                        },
                    });
                } catch (tokenError) {
                    console.error('Error deducting tokens:', tokenError);
                    // Note: We don't fail the request here as the presentation was already created
                }

                return NextResponse.json({
                    presentation: {
                        ...presentation,
                        slides: slides,
                    },
                    tokensUsed: requiredTokens,
                });
            } catch (err) {
                console.error('Error with direct MongoDB method, falling back to Prisma:', err);

                const presentation = await prisma.presentation.create({
                    data: {
                        title: title || 'AI Generated Presentation',
                        description: prompt,
                        userId,
                        slides: stringifyJsonField(slides),
                    },
                });

                // Deduct tokens after successful generation (fallback case)
                try {
                    await deductTokens({
                        userId,
                        amount: requiredTokens,
                        description: `Generated ${topics.length} slides for presentation "${title || 'AI Generated Presentation'}"`,
                        metadata: {
                            presentationId: presentation.id,
                            slidesCount: topics.length,
                            prompt: prompt.substring(0, 100), // First 100 chars of prompt
                        },
                    });
                } catch (tokenError) {
                    console.error('Error deducting tokens:', tokenError);
                }

                return NextResponse.json({
                    presentation: {
                        ...presentation,
                        slides: slides,
                    },
                    tokensUsed: requiredTokens,
                });
            }
        } catch (error) {
            console.error('Error selecting templates:', error);
            // Fallback to basic slides if template selection fails
            const slidesData = topics.map((topic: any) => ({
                id: `slide-${generateId()}`,
                title: topic.title,
                layouts: [
                    {
                        id: `layout-${generateId()}`,
                        type: 'blank',
                        elements: [
                            {
                                id: `element-${generateId()}`,
                                type: 'editor',
                                content: topic.title,
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
                    description: prompt,
                    userId,
                    slides: stringifyJsonField(slidesData),
                },
            });

            // Deduct tokens even for fallback case (basic slides still use AI for template selection)
            try {
                await deductTokens({
                    userId,
                    amount: requiredTokens,
                    description: `Generated ${topics.length} basic slides for presentation "${title || 'AI Generated Presentation'}"`,
                    metadata: {
                        presentationId: presentation.id,
                        slidesCount: topics.length,
                        prompt: prompt.substring(0, 100),
                        fallback: true,
                    },
                });
            } catch (tokenError) {
                console.error('Error deducting tokens:', tokenError);
            }

            return NextResponse.json({
                presentation: {
                    ...presentation,
                    slides: slidesData,
                },
                tokensUsed: requiredTokens,
            });
        }
    } catch (error) {
        console.error('Error creating presentation:', error);
        return NextResponse.json({ error: 'Error creating presentation' }, { status: 500 });
    }
}
