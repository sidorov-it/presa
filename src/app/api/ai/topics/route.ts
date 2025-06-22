import { NextRequest } from 'next/server';
import { generateTopics } from '@/services/llm/gigaChat';
import { withTokenDeduction, TokenCalculators, MetadataExtractors } from '@/utils/aiTokenMiddleware';

export async function POST(request: NextRequest) {
    return withTokenDeduction(
        request,
        {
            operation: 'GENERATE_TEXT',
            description: 'Generate presentation topics',
            calculateTokens: TokenCalculators.generateText,
            metadata: MetadataExtractors.topics,
        },
        async (session, requestData) => {
            const { description, numSlides, tone } = requestData;

            if (!description) {
                throw new Error('Description is required');
            }

            const { title, topics } = await generateTopics(session.user.id, description, numSlides, tone);

            return {
                title,
                description,
                topics,
            };
        }
    );
}
