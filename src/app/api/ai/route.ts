/* eslint-disable prettier/prettier */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateId } from '@/utils/id';
import { stringifyJsonField } from '@/utils/json';
import { createPresentationWithoutTransaction } from '@/utils/mongodb-helpers';
import { TemplateTransformers } from '@/templates/transformers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { generateSlidesTemplates } from '@/services/llm/gigaChat';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { createSlideFromTemplate } from '@/utils/createSlideFromTemplate';

if (!process.env.GIGACHAT_API_KEY || !process.env.GIGACHAT_AUTH_KEY || !process.env.GIGACHAT_SCOPE) {
    throw new Error('GIGACHAT_API_KEY, GIGACHAT_AUTH_KEY, and GIGACHAT_SCOPE environment variables are not set');
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { title, prompt, topics } = await request.json();

        if (!prompt || !topics || !Array.isArray(topics)) {
            return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
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

            const slidesData = templateSuggestions.map((suggestion: any, index: number) => {
                const template = SlideTemplatesRegistry[suggestion.templateId];
                if (!template) {
                    // Fallback to standard template if suggested template not found
                    return {
                        id: `slide-${generateId()}`,
                        title: topics[index].title,
                        layouts: [
                            {
                                id: `layout-${generateId()}`,
                                type: 'blank',
                                elements: [
                                    {
                                        id: `element-${generateId()}`,
                                        type: 'text',
                                        content: topics[index].title,
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
                    };
                }

                // Convert template to menu item format
                const menuItem = TemplateTransformers.toMenuRegistry(template);
                // Create slide from template
                const slide = createSlideFromTemplate(menuItem.templateConfig!);
                slide.title = topics[index].title;
                return slide;
            });

            // Create presentation with the slides
            try {
                const presentation = await createPresentationWithoutTransaction({
                    title: title || 'AI Generated Presentation',
                    description: prompt,
                    slides: slidesData,
                    userId,
                });

                return NextResponse.json({
                    presentation: {
                        ...presentation,
                        slides: slidesData,
                    },
                });
            } catch (err) {
                console.error('Error with direct MongoDB method, falling back to Prisma:', err);

                const presentation = await prisma.presentation.create({
                    data: {
                        title: title || 'AI Generated Presentation',
                        description: prompt,
                        userId,
                        slides: stringifyJsonField(slidesData),
                    },
                });

                return NextResponse.json({
                    presentation: {
                        ...presentation,
                        slides: slidesData,
                    },
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
                                type: 'text',
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

            return NextResponse.json({
                presentation: {
                    ...presentation,
                    slides: slidesData,
                },
            });
        }
    } catch (error) {
        console.error('Error creating presentation:', error);
        return NextResponse.json({ error: 'Error creating presentation' }, { status: 500 });
    }
}
