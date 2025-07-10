/**
 * Calculate estimated cost in tokens for different operations
 */
export const TOKEN_COSTS = {
    GENERATE_SLIDE: 5,
    GENERATE_TEXT: 5,
    GENERATE_IMAGE: 5,
    GENERATE_TOPICS: 0,
} as const;

export function getTokenCostForOperation(operation: keyof typeof TOKEN_COSTS): number {
    return TOKEN_COSTS[operation];
}

// 1 слайд - 10 руб - 5 токенов - 1000 юнитов - 0,2руб
// изображение - 2.2 руб - 5 токенов
// переписать текст слайда - 5 токенов - 1000 юнитов - 0,2руб

// 200 токенов -  20 запросов. 1 преза - 10 слайдов - 50 токенов

// 200 / 5 = 40 запросов
// 30 текстовых запросов - 150 токенов
// 10 изображений - 50 токенов

// 200 токенов - 100 руб

// 100 / 10 = 10 запросов
// 10 текстовых запросов - 50 токенов
// 0 изображений - 0 токенов

// 100 токенов - 100 руб


// ------------------------------------------------------------ //

