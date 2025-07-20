import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasEnoughTokens, deductTokens } from '@/utils/tokens';
import { getTokenCostForOperation, TOKEN_COSTS } from '@/utils/getTokenCostForOperation';
import logger from '@/utils/logger';

interface AIOperationConfig {
    operation: keyof typeof TOKEN_COSTS;
    description: string;
    calculateTokens: (requestData: any) => number; // Required server-side token calculation
    metadata?: (requestData: any) => Record<string, any>; // Custom metadata extraction
}

/**
 * Middleware for handling token deduction in AI routes
 * Checks user authentication, token balance, executes operation, and deducts tokens
 * All token logic is handled server-side for security
 */
export async function withTokenDeduction<T>(
    request: NextRequest,
    config: AIOperationConfig,
    operation: (session: any, requestData: any, formData?: FormData) => Promise<T>
): Promise<NextResponse> {
    let requestData: any;
    let formData: FormData | undefined;

    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request data - handle both JSON and FormData
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            // Handle FormData (for file uploads)
            try {
                formData = await request.formData();
                // For FormData, create a simple object with non-file fields for token calculation
                requestData = {};
                for (const [key, value] of formData.entries()) {
                    if (typeof value === 'string') {
                        requestData[key] = value;
                    }
                }
            } catch (parseError) {
                logger.error(`Error parsing FormData: ${String(parseError)}`);
                return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
            }
        } else {
            // Handle JSON data
            try {
                requestData = await request.json();
            } catch (parseError) {
                logger.error(`Error parsing request data: ${String(parseError)}`);
                return NextResponse.json({ error: 'Invalid JSON data' }, { status: 400 });
            }
        }

        // Calculate required tokens server-side only
        const requiredTokens = config.calculateTokens(requestData);

        // Check if user has enough tokens
        const hasTokens = await hasEnoughTokens(session.user.id, requiredTokens);
        if (!hasTokens) {
            return NextResponse.json(
                {
                    error: 'Insufficient tokens',
                    message: `You need ${requiredTokens} tokens for this operation. Please purchase more tokens to continue.`,
                    requiredTokens,
                    operation: config.operation,
                },
                { status: 402 }
            );
        }

        // Execute the AI operation
        const result = await operation(session, requestData, formData);

        // Deduct tokens after successful operation
        try {
            const metadata = config.metadata ? config.metadata(requestData) : {};

            await deductTokens({
                userId: session.user.id,
                amount: requiredTokens,
                description: config.description,
                metadata,
                llmrequestId: request.headers.get('x-llm-request-id') || '',
            });
        } catch (tokenError) {
            logger.error(`Error deducting tokens: ${String(tokenError)}`);
            // Note: We don't fail the request here as the operation was already completed
            // In production, you might want to implement a compensation mechanism
        }

        // Return result with token usage information
        return NextResponse.json({
            ...(typeof result === 'object' && result !== null ? result : { result }),
            tokensUsed: requiredTokens,
        });
    } catch (error) {
        logger.error(`Error in AI operation: ${error?.message} ${error?.stack}`);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * Server-side token calculators for different operations
 * These functions ensure token calculation logic is secure and consistent
 */
export const TokenCalculators = {
    generatePresentationFromDocument: (requestData: any): number => {
        const { numSlides } = requestData;
        return getTokenCostForOperation('GENERATE_PRESENTATION_FROM_DOCUMENT') * numSlides;
    },

    /**
     * Calculate tokens for slide generation based on number of topics
     */
    generateSlides: (requestData: any): number => {
        const { topics } = requestData;
        if (!topics || !Array.isArray(topics)) {
            throw new Error('Invalid topics data for token calculation');
        }
        return topics.length * getTokenCostForOperation('GENERATE_SLIDE');
    },

    /**
     * Fixed token cost for single slide generation
     */
    generateSingleSlide: (_requestData: any): number => {
        return getTokenCostForOperation('GENERATE_SLIDE');
    },

    /**
     * Fixed token cost for text generation
     */
    generateText: (_requestData: any): number => {
        return getTokenCostForOperation('GENERATE_TEXT');
    },

    generateTopics: (_requestData: any): number => {
        return getTokenCostForOperation('GENERATE_TOPICS');
    },

    /**
     * Fixed token cost for content improvement
     */
    improveContent: (_requestData: any): number => {
        return getTokenCostForOperation('GENERATE_TEXT');
    },

    /**
     * Fixed token cost for image generation
     */
    generateImage: (_requestData: any): number => {
        return getTokenCostForOperation('GENERATE_IMAGE');
    },
};

/**
 * Common metadata extractors for different operations
 */
export const MetadataExtractors = {
    presentation: (requestData: any) => ({
        title: requestData.title?.substring(0, 100) || 'Untitled Presentation',
        prompt: requestData.prompt?.substring(0, 100) || '',
        slidesCount: Array.isArray(requestData.topics) ? requestData.topics.length : 0,
        mode: 'presentation_generation',
    }),

    slide: (requestData: any) => ({
        presentationId: requestData.presentationId || '',
        slideIndex: requestData.slideIndex ?? -1,
        templateId: requestData.templateId || 'auto',
        prompt: requestData.prompt?.substring(0, 100) || '',
        mode: 'single_slide_generation',
    }),

    topics: (requestData: any) => ({
        description: requestData.description?.substring(0, 100) || '',
        numSlides: requestData.numSlides || 1,
        tone: requestData.tone || 'professional',
        mode: 'topics_generation',
    }),

    improvement: (requestData: any) => ({
        slideId: requestData.slideId || '',
        presentationId: requestData.presentationId || '',
        comment: requestData.comment?.substring(0, 100) || '',
        mode: 'content_improvement',
    }),

    images: (requestData: any) => ({
        prompt: requestData.prompt?.substring(0, 100) || '',
        mode: 'images_generation',
    }),
};
