/**
 * Функция для правильного склонения слов в зависимости от числа
 * @param count - количество
 * @param one - форма для 1 (например, "слайд")
 * @param few - форма для 2-4 (например, "слайда")
 * @param many - форма для 5+ (например, "слайдов")
 * @returns правильная форма слова
 */
export const pluralize = (count: number, one: string, few: string, many: string): string => {
    const absCount = Math.abs(count);
    const lastDigit = absCount % 10;
    const lastTwoDigits = absCount % 100;

    // Для чисел 11-14 всегда используется форма "many"
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return many;
    }

    // Для остальных случаев смотрим на последнюю цифру
    switch (lastDigit) {
        case 1:
            return one;
        case 2:
        case 3:
        case 4:
            return few;
        default:
            return many;
    }
};

/**
 * Удобная функция для склонения слова "слайд"
 * @param count - количество слайдов
 * @returns правильная форма слова "слайд"
 */
export const pluralizeSlide = (count: number): string => {
    return pluralize(count, 'слайд', 'слайда', 'слайдов');
};

/**
 * Удобная функция для склонения слова "презентация"
 * @param count - количество презентаций
 * @returns правильная форма слова "презентация"
 */
export const pluralizePresentation = (count: number): string => {
    return pluralize(count, 'презентация', 'презентации', 'презентаций');
};

/**
 * Удобная функция для склонения слова "элемент"
 * @param count - количество элементов
 * @returns правильная форма слова "элемент"
 */
export const pluralizeElement = (count: number): string => {
    return pluralize(count, 'элемент', 'элемента', 'элементов');
};
