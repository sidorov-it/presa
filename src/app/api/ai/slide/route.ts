import { NextRequest, NextResponse } from 'next/server';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import generateSlidesTemplates from '@/services/llm/gigaChat/generateSlidesTemplates';
import { prisma } from '@/lib/prisma';
import extractTextsFromPresentation from '@/utils/extractTextsFromPresentation';
import { IPresentation } from '@/types';
import generateSlide from '@/services/llm/gigaChat/generateSlide';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { hasEnoughTokens, deductTokens } from '@/utils/tokens';
import { getTokenCostForOperation } from '@/utils/getTokenCostForOperation';

interface RequestBody {
    presentationId: string;
    slideIndex: number;
    prompt: string;
    templateId: string;
    surroundingSlides: {
        title: string;
        content: string;
    }[];
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body: RequestBody = await request.json();
        const { prompt, templateId, slideIndex, presentationId } = body;

        // Calculate required tokens
        const requiredTokens = getTokenCostForOperation('GENERATE_SLIDE');

        // Check if user has enough tokens
        const hasTokens = await hasEnoughTokens(session.user.id, requiredTokens);
        if (!hasTokens) {
            return NextResponse.json({
                error: 'Insufficient tokens',
                message: `You need ${requiredTokens} tokens to generate a slide. Please purchase more tokens to continue.`,
                requiredTokens,
                operation: 'GENERATE_SLIDE',
            }, { status: 402 });
        }

        const presentation = await prisma.presentation.findUnique({
            where: { id: presentationId },
        });

        if (!presentation) {
            return new Response(JSON.stringify({ error: 'Presentation not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const slideTexts = extractTextsFromPresentation(presentation as unknown as IPresentation);
        const surroundingSlides = slideTexts.slice(Math.max(0, slideIndex - 2), slideIndex + 2);

        // If templateId is 'auto', we need to select the best template using LLM
        let finalTemplateId = templateId;

        if (templateId === 'auto') {
            // Generate template suggestions based on the prompt and surrounding slides
            const templateSuggestions = await generateSlidesTemplates({
                title: surroundingSlides[0]?.text || '',
                prompt,
                topics: surroundingSlides.map(slide => ({ title: slide.text })),
                options: {
                    userId: session.user.id,
                    presentationId,
                },
            });

            // Use the first suggested template or fallback to a default one
            finalTemplateId = templateSuggestions[0]?.templateId || 'title-bullets';
        }

        // Validate that the template exists
        const template = SlideTemplatesRegistry[finalTemplateId];
        if (!template) {
            return new Response(JSON.stringify({ error: 'Template not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // const template = SlideTemplatesRegistry[templateSuggestions[i].templateId];

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
            options: {
                userId: session.user.id,
                presentationId,
            },
        });

        // Deduct tokens after successful generation
        try {
            await deductTokens({
                userId: session.user.id,
                amount: requiredTokens,
                description: `Generated slide ${slideIndex + 1} for presentation`,
                metadata: {
                    presentationId,
                    slideIndex,
                    templateId: finalTemplateId,
                    prompt: prompt.substring(0, 100), // First 100 chars of prompt
                },
            });
        } catch (tokenError) {
            console.error('Error deducting tokens:', tokenError);
            // Note: We don't fail the request here as the slide was already generated
        }

        return new Response(JSON.stringify({ 
            slide,
            tokensUsed: requiredTokens,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error generating slide:', error);
        return new Response(
            JSON.stringify({
                error: 'Failed to generate slide',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
