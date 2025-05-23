import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateTopics } from '@/services/llm/gigaChat';
import { hasEnoughTokens, deductTokens } from '@/utils/tokens';
import { getTokenCostForOperation } from '@/utils/getTokenCostForOperation';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { description, numSlides, tone } = await req.json();

        if (!description) {
            return NextResponse.json({ message: 'Description is required' }, { status: 400 });
        }

        // Calculate required tokens
        const requiredTokens = getTokenCostForOperation('GENERATE_TEXT');

        // Check if user has enough tokens
        const hasTokens = await hasEnoughTokens(session.user.id, requiredTokens);
        if (!hasTokens) {
            return NextResponse.json({
                error: 'Insufficient tokens',
                message: `You need ${requiredTokens} tokens to generate presentation topics. Please purchase more tokens to continue.`,
                requiredTokens,
                operation: 'GENERATE_TEXT',
            }, { status: 402 });
        }

        try {
            const { title, topics } = await generateTopics(session.user.id, description, numSlides, tone);

            // Deduct tokens after successful generation
            try {
                await deductTokens({
                    userId: session.user.id,
                    amount: requiredTokens,
                    description: `Generated presentation topics for "${title}"`,
                    metadata: {
                        topicsCount: topics.length,
                        description: description.substring(0, 100), // First 100 chars
                        tone,
                    },
                });
            } catch (tokenError) {
                console.error('Error deducting tokens:', tokenError);
                // Note: We don't fail the request here as the topics were already generated
            }

            return NextResponse.json({
                title,
                description,
                topics,
                tokensUsed: requiredTokens,
            });
        } catch (error) {
            console.error('Error generating topics:', error);
            return NextResponse.json({ error: 'Failed to generate presentation topics' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in topics route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
