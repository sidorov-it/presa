import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasEnoughTokens, deductTokens } from '@/utils/tokens';
import { getTokenCostForOperation, TOKEN_COSTS } from '@/utils/getTokenCostForOperation';

interface AIOperationConfig {
    operation: keyof typeof TOKEN_COSTS;
    description: string;
    calculateTokens?: (data: any) => number; // Custom token calculation function
    metadata?: (data: any) => Record<string, any>; // Custom metadata extraction
}

/**
 * Middleware for handling token deduction in AI routes
 * Checks user authentication, token balance, executes operation, and deducts tokens
 */
export async function withTokenDeduction<T>(
    request: NextRequest,
    config: AIOperationConfig,
    operation: (session: any, requestData: any) => Promise<T>
): Promise<NextResponse> {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Parse request data
        const requestData = await request.json();

        // Calculate required tokens
        const requiredTokens = config.calculateTokens 
            ? config.calculateTokens(requestData)
            : getTokenCostForOperation(config.operation);

        // Check if user has enough tokens
        const hasTokens = await hasEnoughTokens(session.user.id, requiredTokens);
        if (!hasTokens) {
            return NextResponse.json({
                error: 'Insufficient tokens',
                message: `You need ${requiredTokens} tokens for this operation. Please purchase more tokens to continue.`,
                requiredTokens,
                operation: config.operation,
            }, { status: 402 });
        }

        // Execute the AI operation
        const result = await operation(session, requestData);

        // Deduct tokens after successful operation
        try {
            const metadata = config.metadata ? config.metadata(requestData) : {};
            
            await deductTokens({
                userId: session.user.id,
                amount: requiredTokens,
                description: config.description,
                metadata,
            });
        } catch (tokenError) {
            console.error('Error deducting tokens:', tokenError);
            // Note: We don't fail the request here as the operation was already completed
        }

        // Return result with token usage information
        return NextResponse.json({
            ...(typeof result === 'object' ? result : { result }),
            tokensUsed: requiredTokens,
        });

    } catch (error) {
        console.error('Error in AI operation:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * Helper function to create token calculation for slide generation
 */
export const calculateSlideTokens = (requestData: any): number => {
    const { topics, numSlides } = requestData;
    const slideCount = topics?.length || numSlides || 1;
    return slideCount * getTokenCostForOperation('GENERATE_SLIDE');
};

/**
 * Common metadata extractors
 */
export const extractPresentationMetadata = (requestData: any) => ({
    title: requestData.title?.substring(0, 100),
    prompt: requestData.prompt?.substring(0, 100),
    slidesCount: requestData.topics?.length || requestData.numSlides || 1,
});

export const extractSlideMetadata = (requestData: any) => ({
    presentationId: requestData.presentationId,
    slideIndex: requestData.slideIndex,
    templateId: requestData.templateId,
    prompt: requestData.prompt?.substring(0, 100),
});

export const extractTopicsMetadata = (requestData: any) => ({
    description: requestData.description?.substring(0, 100),
    numSlides: requestData.numSlides,
    tone: requestData.tone,
});

export const extractImproveMetadata = (requestData: any) => ({
    slideId: requestData.slideId,
    presentationId: requestData.presentationId,
    comment: requestData.comment?.substring(0, 100),
}); 