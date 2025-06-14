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

/**
 * Возвращает правильную форму слова в зависимости от количества
 * @param count количество
 * @param forms массив с формами слова
 * @returns правильная форма слова
 */
export const pluralize = (count: number = 0, forms: [string, string, string]): string => {
    const cases = [2, 0, 1, 1, 1, 2];
    const index = count % 100 > 4 && count % 100 < 20 ? 2 : cases[Math.min(count % 10, 5)];
    return `${count} ${forms[index]}`;
};

/**
 * Возвращает строку с относительным временем в формате "n дней назад"
 * @param dateInput дата или временная метка
 * @returns строка с относительным временем
 */
export const formatRelativeTime = (dateInput: string | number | Date): string => {
    const date = new Date(dateInput);
    const now = Date.now();
    const diffMinutes = Math.floor((now - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'только что';

    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) {
        return `${pluralize(diffYears, ['год', 'года', 'лет'])} назад`;
    }
    if (diffMonths > 0) {
        return `${pluralize(diffMonths, ['месяц', 'месяца', 'месяцев'])} назад`;
    }
    if (diffDays > 0) {
        return `${pluralize(diffDays, ['день', 'дня', 'дней'])} назад`;
    }
    if (diffHours > 0) {
        return `${pluralize(diffHours, ['час', 'часа', 'часов'])} назад`;
    }
    return `${pluralize(diffMinutes, ['минута', 'минуты', 'минут'])} назад`;
};
