/* eslint-disable indent */
import { prisma } from '@/lib/prisma';

export interface LLMRequestData {
    userId: string;
    provider: string;
    presentationId?: string;
    requestId?: string;
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
                    provider: data.provider,
                    presentationId: data.presentationId,
                    requestId: data.requestId,
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
                    metadata: data.metadata || {},
                    functionCall: data.functionCall,
                    functionArguments: data.functionArguments,
                    responseContent: data.responseContent,
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
            requestId?: string;
        }
    ) {
        return await prisma.lLMRequestHistory.findMany({
            where: {
                userId,
                ...(options?.requestId ? { requestId: options.requestId } : {}),
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

    /** Get full history */
    static async getAllHistory(options?: { 
        limit?: number; 
        offset?: number;
        requestId?: string;
        userId?: string;
        provider?: string;
    }) {
        return prisma.lLMRequestHistory.findMany({
            where: {
                ...(options?.requestId ? { requestId: options.requestId } : {}),
                ...(options?.userId ? { userId: options.userId } : {}),
                ...(options?.provider ? { provider: options.provider } : {}),
            },
            orderBy: { timestamp: 'desc' },
            skip: options?.offset ?? 0,
            take: options?.limit ?? 50,
        });
    }

    /** Get global stats */
    static async getGlobalStats() {
        const totalRequests = await prisma.lLMRequestHistory.count();
        const [byProvider, byType, errorCount] = await Promise.all([
            prisma.lLMRequestHistory.groupBy({ by: ['provider'], _count: true }),
            prisma.lLMRequestHistory.groupBy({ by: ['requestType'], _count: true }),
            prisma.lLMRequestHistory.count({ where: { success: false } }),
        ]);
        return {
            totalRequests,
            errorCount,
            errorRate: totalRequests ? errorCount / totalRequests : 0,
            byProvider: byProvider.map(p => ({ provider: p.provider, count: p._count })),
            byType: byType.map(t => ({ type: t.requestType, count: t._count })),
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

    /**
     * Get all requests for a specific requestId
     */
    static async getRequestsByRequestId(requestId: string) {
        return await prisma.lLMRequestHistory.findMany({
            where: { requestId },
            orderBy: { timestamp: 'asc' },
        });
    }

    /**
     * Get unique request IDs with basic info
     */
    static async getRequestIds(options?: {
        limit?: number;
        userId?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const where = {
            requestId: { not: null },
            ...(options?.userId ? { userId: options.userId } : {}),
            ...(options?.startDate && options?.endDate
                ? {
                      timestamp: {
                          gte: options.startDate,
                          lte: options.endDate,
                      },
                  }
                : {}),
        };

        return await prisma.lLMRequestHistory.groupBy({
            by: ['requestId'],
            where,
            _count: {
                id: true,
            },
            _min: {
                timestamp: true,
            },
            _max: {
                timestamp: true,
            },
            orderBy: {
                _min: {
                    timestamp: 'desc',
                },
            },
            take: options?.limit || 100,
        });
    }
}
