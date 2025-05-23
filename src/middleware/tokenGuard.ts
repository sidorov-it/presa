import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasEnoughTokens } from '@/utils/tokens';
import { getTokenCostForOperation, TOKEN_COSTS } from '@/utils/getTokenCostForOperation';

export interface TokenGuardOptions {
    operation: keyof typeof TOKEN_COSTS;
    customCost?: number;
    onInsufficientTokens?: () => NextResponse;
}

/**
 * Middleware to check if user has enough tokens for an operation
 */
export async function withTokenGuard(
    request: NextRequest,
    options: TokenGuardOptions,
    handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const requiredTokens = options.customCost || getTokenCostForOperation(options.operation);
        const hasTokens = await hasEnoughTokens(session.user.id, requiredTokens);

        if (!hasTokens) {
            if (options.onInsufficientTokens) {
                return options.onInsufficientTokens();
            }

            return NextResponse.json(
                {
                    error: 'Insufficient tokens',
                    message: `This operation requires ${requiredTokens} tokens. Please purchase more tokens to continue.`,
                    requiredTokens,
                    operation: options.operation,
                },
                { status: 402 } // Payment Required
            );
        }

        // User has enough tokens, proceed with the request
        return await handler(request);
    } catch (error) {
        console.error('Token guard error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * Helper function to create a token guard wrapper
 */
export function createTokenGuard(options: TokenGuardOptions) {
    return (handler: (request: NextRequest) => Promise<NextResponse>) => {
        return (request: NextRequest) => withTokenGuard(request, options, handler);
    };
}

/**
 * Common responses for insufficient tokens
 */
export const InsufficientTokensResponses = {
    generateSlide: () =>
        NextResponse.json(
            {
                error: 'Insufficient tokens',
                message: 'You need more tokens to generate slides. Each slide costs 50 tokens.',
                requiredTokens: TOKEN_COSTS.GENERATE_SLIDE,
                operation: 'GENERATE_SLIDE',
            },
            { status: 402 }
        ),

    generateText: () =>
        NextResponse.json(
            {
                error: 'Insufficient tokens',
                message: 'You need more tokens to generate text. Text generation costs 25 tokens.',
                requiredTokens: TOKEN_COSTS.GENERATE_TEXT,
                operation: 'GENERATE_TEXT',
            },
            { status: 402 }
        ),

    generateImage: () =>
        NextResponse.json(
            {
                error: 'Insufficient tokens',
                message: 'You need more tokens to generate images. Image generation costs 100 tokens.',
                requiredTokens: TOKEN_COSTS.GENERATE_IMAGE,
                operation: 'GENERATE_IMAGE',
            },
            { status: 402 }
        ),
};
