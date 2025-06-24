import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import rewriteSlideContent from '@/services/llm/rewriteSlideContent';
import { withTokenDeduction, TokenCalculators, MetadataExtractors } from '@/utils/aiTokenMiddleware';
import logger from '@/utils/logger';

interface RequestBody {
    slideId: string;
    presentationId: string;
}

export async function POST(request: NextRequest) {
    logger.info('POST /api/ai/simplify');
    return withTokenDeduction(
        request,
        {
            operation: 'GENERATE_TEXT',
            description: 'Simplify slide text',
            calculateTokens: TokenCalculators.improveContent,
            metadata: MetadataExtractors.improvement,
        },
        async (session, requestData: RequestBody) => {
            const { slideId, presentationId } = requestData;

            if (!slideId || !presentationId) {
                throw new Error('Missing required fields: slideId or presentationId');
            }

            const presentation = await prisma.presentation.findUnique({
                where: { id: presentationId },
            });

            if (!presentation) {
                throw new Error('Presentation not found');
            }

            const slideIndex = presentation.slides.findIndex((s: any) => s.id === slideId);
            if (slideIndex === -1) {
                throw new Error('Slide not found');
            }

            const currentSlide = presentation.slides[slideIndex];
            const content = await rewriteSlideContent(
                session.user.id,
                currentSlide,
                'Упрости формулировки, сделай текст понятнее.'
            );

            return { content };
        }
    );
}
