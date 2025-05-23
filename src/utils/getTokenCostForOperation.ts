/**
 * Calculate estimated cost in tokens for different operations
 */
export const TOKEN_COSTS = {
    GENERATE_SLIDE: 50,
    GENERATE_TEXT: 25,
    GENERATE_IMAGE: 100,
    GENERATE_THEME: 75,
    CHAT_MESSAGE: 10,
} as const;

export function getTokenCostForOperation(operation: keyof typeof TOKEN_COSTS): number {
    return TOKEN_COSTS[operation];
}
