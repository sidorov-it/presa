import { prisma } from '@/lib/prisma';

export interface LLMRequestData {
    userId: string;
    presentationId?: string;
    requestType: string;
    prompt: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    duration: number;
    cached?: boolean;
    cost: number;
    success?: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
    functionCall?: string;
    functionArguments?: string;
    responseContent?: string;
}

export class LLMHistoryService {
    /**
     * Log a new LLM request
     */
    static async logRequest(data: LLMRequestData) {
        try {
            return await prisma.lLMRequestHistory.create({
                data: {
                    userId: data.userId,
                    presentationId: data.presentationId,
                    requestType: data.requestType,
                    prompt: data.prompt,
                    inputTokens: data.inputTokens,
                    outputTokens: data.outputTokens,
                    totalTokens: data.totalTokens,
                    duration: data.duration,
                    cached: data.cached ?? false,
                    cost: data.cost,
                    success: data.success ?? true,
                    errorMessage: data.errorMessage,
                    // metadata: data.metadata || {},
                },
            });
        } catch (error) {
            console.error('Failed to log LLM request:', error);
            // Don't throw - we don't want logging failures to break the main flow
        }
    }

    /**
     * Get user's request history
     */
    static async getUserHistory(
        userId: string,
        options?: {
            limit?: number;
            offset?: number;
            startDate?: Date;
            endDate?: Date;
        }
    ) {
        return await prisma.lLMRequestHistory.findMany({
            where: {
                userId,
                ...(options?.startDate && options?.endDate
                    ? {
                          timestamp: {
                            gte: options.startDate,
                            lte: options.endDate,
                          },
                      }
                    : {}),
            },
            orderBy: { timestamp: 'desc' },
            skip: options?.offset || 0,
            take: options?.limit || 50,
        });
    }

    /**
     * Get user's usage statistics
     */
    static async getUserStats(userId: string, startDate?: Date, endDate?: Date) {
        const where = {
            userId,
            ...(startDate && endDate
                ? {
                      timestamp: {
                        gte: startDate,
                          lte: endDate,
                    },
                  }
                : {}),
        };

        const [totals, requestTypes] = await Promise.all([
            // Get total tokens and costs
            prisma.lLMRequestHistory.aggregate({
                where,
                _sum: {
                    inputTokens: true,
                    outputTokens: true,
                    totalTokens: true,
                    cost: true,
                },
                _avg: {
                    duration: true,
                },
                _count: true,
            }),

            // Get breakdown by request type
            prisma.lLMRequestHistory.groupBy({
                by: ['requestType'],
                where,
                _sum: {
                    totalTokens: true,
                    cost: true,
                },
                _count: true,
            }),
        ]);

        return {
            totalRequests: totals._count,
            totalTokens: totals._sum.totalTokens || 0,
            totalCost: totals._sum.cost || 0,
            averageDuration: totals._avg.duration || 0,
            byRequestType: requestTypes.map(type => ({
                requestType: type.requestType,
                requests: type._count,
                tokens: type._sum.totalTokens || 0,
                cost: type._sum.cost || 0,
            })),
        };
    }

    /**
     * Get history for a specific presentation
     */
    static async getPresentationHistory(presentationId: string) {
        return await prisma.lLMRequestHistory.findMany({
            where: { presentationId },
            orderBy: { timestamp: 'desc' },
        });
    }

    /**
     * Get cached response if exists
     */
    static async getCachedResponse(prompt: string, requestType: string) {
        const cachedRequest = await prisma.lLMRequestHistory.findFirst({
            where: {
                prompt,
                requestType,
                cached: true,
                success: true,
            },
            orderBy: { timestamp: 'desc' },
        });

        return cachedRequest?.metadata?.response;
    }
}
