import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { generateId } from '@/utils/id';
import { stringifyJsonField } from '@/utils/json';
import { createPresentationWithoutTransaction } from '@/utils/mongodb-helpers';
import { SlideContentGenerator } from '@/services/llm/slideGenerator';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { prompt, title } = await request.json();
        // The language parameter is reserved for future localization features

        // Validate inputs
        if (!prompt) {
            return NextResponse.json({ message: 'Prompt is required' }, { status: 400 });
        }

        console.log('[AI Presentation Debug] Starting generation process', { userId, prompt, title });

        // Define a mock LLM service for simulation
        const mockLLMService = {
            generate: async (promptText: string) => {
                console.log('[AI Presentation Debug] Sending mock LLM request with prompt:', promptText);
                // Simulate a response based on the prompt content
                return {
                    elements: [
                        {
                            type: 'text',
                            content: `Generated content based on: ${promptText.slice(0, 50)}...`,
                            metadata: {},
                        },
                        {
                            type: 'image',
                            content: 'Generated image alt text',
                            metadata: {},
                        },
                    ],
                };
            },
        };

        // Use SlideContentGenerator with the mock LLM service
        const generator = new SlideContentGenerator(mockLLMService);

        // Define slide templates to use for generation
        const slideTemplateIds = ['image-text', 'text-image', 'two-columns'];
        const totalSlides = slideTemplateIds.length;
        const slidesData = [];

        // Generate content for each slide individually
        for (let i = 0; i < totalSlides; i++) {
            const templateId = slideTemplateIds[i];
            console.log(`[AI Presentation Debug] Generating slide ${i + 1} with template ${templateId}`);

            const context = {
                topic: prompt,
                audience: 'General',
                style: 'Professional',
                slideIndex: i + 1,
                totalSlides,
                previousContent: i > 0 ? slidesData[i - 1] : undefined,
            };

            try {
                const slideContent = await generator.generateContent(templateId, context);
                console.log(`[AI Presentation Debug] Received content for slide ${i + 1}`, slideContent);

                const slideId = `slide-${generateId()}`;
                const elements = slideContent.elements.map((elem: any, index: number) => ({
                    id: `element-${generateId()}`,
                    type: elem.type,
                    content: elem.props.content || '',
                    position: { x: 100, y: 100 + index * 100 },
                    size: { width: 600, height: 100 },
                }));

                slidesData.push({
                    id: slideId,
                    layout: templateId,
                    elements,
                });
            } catch (error) {
                console.error(`[AI Presentation Debug] Error generating slide ${i + 1}:`, error);
                // Fallback to a default slide if generation fails
                slidesData.push({
                    id: `slide-${generateId()}`,
                    layout: 'standard',
                    elements: [
                        {
                            id: `element-${generateId()}`,
                            type: 'text',
                            content: `Fallback content for slide ${i + 1}`,
                            position: { x: 100, y: 100 },
                            size: { width: 600, height: 100 },
                        },
                    ],
                });
            }
        }

        console.log('[AI Presentation Debug] All slides generated', slidesData);

        // Try to create the presentation using the helper function that avoids transactions
        try {
            const presentation = await createPresentationWithoutTransaction({
                title: title || 'AI Generated Presentation',
                description: `Generated from prompt: ${prompt}`,
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

            // Fall back to regular Prisma method
            const presentation = await prisma.presentation.create({
                data: {
                    title: title || 'AI Generated Presentation',
                    description: `Generated from prompt: ${prompt}`,
                    userId: userId,
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
        console.error('Error generating AI presentation:', error);
        return NextResponse.json({ error: 'Error generating AI presentation' }, { status: 500 });
    }
}
