/**
 * Форматирует дату в читаемый формат
 * @param timestamp временная метка в миллисекундах
 * @returns отформатированная дата
 */
export const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Создает глубокую копию объекта
 * @param obj объект для копирования
 * @returns глубокая копия объекта
 */
export const deepClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Проверяет, является ли строка URL-адресом
 * @param str строка для проверки
 * @returns true, если строка является URL-адресом
 */
export const isValidUrl = (str: string): boolean => {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
};

/**
 * Преобразует цвет из HEX в RGBA
 * @param hex HEX-код цвета
 * @param alpha прозрачность (0-1)
 * @returns строка RGBA
 */
export const hexToRgba = (hex: string, alpha: number = 1): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Ограничивает число в заданном диапазоне
 * @param value значение
 * @param min минимальное значение
 * @param max максимальное значение
 * @returns ограниченное значение
 */
export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

/**
 * Задержка выполнения
 * @param ms миллисекунды
 * @returns Promise, который разрешается через указанное время
 */
export const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Преобразует первую букву строки в заглавную
 * @param str строка
 * @returns строка с заглавной первой буквой
 */
export const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}; 