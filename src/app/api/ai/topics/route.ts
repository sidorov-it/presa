import { NextRequest } from 'next/server';
import { generateTopics } from '@/services/llm/gigaChat';
import { withTokenDeduction, TokenCalculators, MetadataExtractors } from '@/utils/aiTokenMiddleware';
import logger from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    const requestId = uuidv4();
    logger.info('POST /api/ai/topics');
    return withTokenDeduction(
        request,
        {
            operation: 'GENERATE_TEXT',
            description: 'Generate presentation topics',
            calculateTokens: TokenCalculators.generateText,
            metadata: MetadataExtractors.topics,
        },
        async (session, requestData) => {
            const { description, numSlides, tone, durationMinutes, goal, audience } = requestData;

            if (!description) {
                throw new Error('Description is required');
            }

            const { title, topics } = await generateTopics(
                session.user.id,
                {
                    description,
                    numSlides,
                    tone,
                    durationMinutes,
                    goal,
                    audience,
                },
                requestId
            );

            return {
                title,
                description,
                topics,
            };
        }
    );
}
