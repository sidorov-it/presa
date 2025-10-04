import { withLogging } from '@/hooks/withLoging';
import { NextRequest } from 'next/server';
import { withTokenDeduction, TokenCalculators, MetadataExtractors } from '@/utils/aiTokenMiddleware';
import logger from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { generateTopicsFromPlan } from '@/services/llm/gigaChat';

async function POSTHandler(request: NextRequest) {
    const requestId = uuidv4();
    return withTokenDeduction(
        request,
        {
            operation: 'GENERATE_TOPICS',
            description: 'Generate presentation topics from plan',
            calculateTokens: TokenCalculators.generateTopics,
            metadata: MetadataExtractors.topics,
        },
        async (session, requestData) => {
            const { plan, tone, contentAmount, durationMinutes, goal, audience } = requestData;

            if (!plan || typeof plan !== 'string') {
                throw new Error('Plan is required and must be a string');
            }

            if (!plan.trim()) {
                throw new Error('Plan cannot be empty');
            }

            try {
                // Generate structured topics from the provided plan
                const { title, topics } = await generateTopicsFromPlan(
                    session.user.id,
                    {
                        plan: plan.trim(),
                        tone,
                        contentAmount,
                        durationMinutes,
                        goal,
                        audience,
                    },
                    requestId
                );

                return {
                    title: title || 'Презентация из готового плана',
                    description: `Презентация создана на основе предоставленного плана`,
                    topics,
                };
            } catch (error) {
                logger.error('Error processing plan:', error.message);
                throw error;
            }
        },
        requestId
    );
}

export const POST = withLogging(POSTHandler);
