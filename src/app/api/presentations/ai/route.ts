import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { generateId } from '@/utils/id';
import { stringifyJsonField } from '@/utils/json';
import { createPresentationWithoutTransaction } from '@/utils/mongodb-helpers';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const { prompt, title } = await request.json();
        // The language parameter is reserved for future localization features

        // Validate inputs
        if (!prompt) {
            return NextResponse.json(
                { message: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Create example slides based on the prompt
        const slidesData = [
            {
                id: `slide-${generateId()}`,
                layout: 'standard',
                elements: [
                    {
                        id: `element-${generateId()}`,
                        type: 'text',
                        content: title || 'AI Generated Presentation',
                        position: { x: 100, y: 100 },
                        size: { width: 600, height: 100 }
                    }
                ]
            },
            {
                id: `slide-${generateId()}`,
                layout: 'standard',
                elements: [
                    {
                        id: `element-${generateId()}`,
                        type: 'text',
                        content: prompt,
                        position: { x: 100, y: 100 },
                        size: { width: 600, height: 300 }
                    }
                ]
            }
        ];

        // Try to create the presentation using the helper function that avoids transactions
        try {
            const presentation = await createPresentationWithoutTransaction({
                title: title || 'AI Generated Presentation',
                description: `Generated from prompt: ${prompt}`,
                slides: slidesData,
                userId
            });

            return NextResponse.json({
                presentation: {
                    ...presentation,
                    slides: slidesData
                }
            });
        } catch (err) {
            console.error('Error with direct MongoDB method, falling back to Prisma:', err);

            // Fall back to regular Prisma method
            const presentation = await prisma.presentation.create({
                data: {
                    title: title || 'AI Generated Presentation',
                    description: `Generated from prompt: ${prompt}`,
                    userId: userId,
                    slides: stringifyJsonField(slidesData)
                },
            });

            return NextResponse.json({
                presentation: {
                    ...presentation,
                    slides: slidesData
                }
            });
        }
    } catch (error) {
        console.error('Error generating AI presentation:', error);
        return NextResponse.json(
            { error: 'Error generating AI presentation' },
            { status: 500 }
        );
    }
}