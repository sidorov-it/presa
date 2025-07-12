import { NextRequest } from 'next/server';
import { generateTopics } from '@/services/llm/gigaChat';
import { withTokenDeduction, TokenCalculators, MetadataExtractors } from '@/utils/aiTokenMiddleware';
import logger from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    const requestId = uuidv4();
    return withTokenDeduction(
        request,
        {
            operation: 'GENERATE_TOPICS',
            description: 'Generate presentation topics',
            calculateTokens: TokenCalculators.generateTopics,
            metadata: MetadataExtractors.topics,
        },
        async (session, requestData) => {
            const { description, numSlides, tone, durationMinutes, goal, audience } = requestData;

            if (!description) {
                throw new Error('Description is required');
            }

            try {
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
            } catch (error) {
                logger.error('Error generating topics:', error.message);
                throw error;
            }
        }
    );
}
