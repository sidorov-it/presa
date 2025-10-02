import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createLLMService } from '@/services/llm';
import { MetadataExtractors, TokenCalculators, withTokenDeduction } from '@/utils/aiTokenMiddleware';

async function POSTHandler(request: NextRequest) {
    return withTokenDeduction(
        request,
        {
            operation: 'GENERATE_IMAGE',
            description: 'Generate images',
            calculateTokens: TokenCalculators.generateImage,
            metadata: MetadataExtractors.images,
        },
        async (session, requestData) => {
            // await new Promise(resolve => setTimeout(resolve, 10000));
            // return NextResponse.json({
            //     images: [
            //         {
            //             url: '/uploads/ce98d291-c254-4812-b064-c63b22b97e98.jpg',
            //             id: 'ce98d291-c254-4812-b064-c63b22b97e98',
            //         },
            //         {
            //             url: '/uploads/4d5dd0ac-5a8c-4007-a92d-fc8637fde6da.jpg',
            //             id: '4d5dd0ac-5a8c-4007-a92d-fc8637fde6da',
            //         },
            //         {
            //             url: '/uploads/c8c7f6a7-d707-4384-a8f2-4d963ac3a48f.jpg',
            //             id: 'c8c7f6a7-d707-4384-a8f2-4d963ac3a48f',
            //         },
            //     ],
            //     generated: 3,
            //     requested: 3,
            // });

            try {
                // Check authentication
                // const session = await getServerSession(authOptions);
                if (!session?.user?.id) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }

                const { prompt, count = 3 } = requestData;

                if (!prompt || typeof prompt !== 'string') {
                    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
                }

                if (count < 1 || count > 5) {
                    return NextResponse.json({ error: 'Count must be between 1 and 5' }, { status: 400 });
                }

                // Initialize LLM service (provider chosen via env or param)
                const llmService = createLLMService({ userId: session.user.id });

                if (!llmService.generateImage) {
                    return NextResponse.json(
                        { error: 'Selected LLM does not support image generation' },
                        { status: 400 }
                    );
                }

                // Generate images
                const images = [];
                for (let i = 0; i < count; i++) {
                    try {
                        const result = await llmService.generateImage(prompt, {
                            userId: session.user.id,
                        });
                        images.push({
                            url: result.imageUrl,
                            id: result.imageId,
                        });
                    } catch (error) {
                        logger.error(`Failed to generate image ${i + 1}:`, error);
                        // Continue with other images even if one fails
                    }
                }

                if (images.length === 0) {
                    return NextResponse.json({ error: 'Failed to generate any images' }, { status: 500 });
                }

                return {
                    images,
                    generated: images.length,
                    requested: count,
                };
            } catch (error) {
                logger.error('Error generating images:', error);
                return NextResponse.json({ error: 'Failed to generate images' }, { status: 500 });
            }
        }
    );
}
export const POST = withLogging(POSTHandler);
