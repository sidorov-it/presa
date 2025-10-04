/**
 * Очищает маркеры списка из текста, сгенерированного LLM
 * Удаляет тире, числа, символы и другие маркеры в начале строк
 */

export const cleanListMarkers = (text: string | string[]): string | string[] => {
    if (Array.isArray(text)) {
        return text.map(item => cleanListMarkers(item as string) as string);
    }

    if (typeof text !== 'string') {
        return text;
    }

    // Обрабатываем экранированные переносы строк от LLM
    let processedText = text
        .replace(/\\n/g, '\n') // Заменяем \n на реальные переносы строк
        .replace(/\\r\\n/g, '\n') // Заменяем \r\n на переносы строк
        .replace(/\\t/g, '    '); // Заменяем \t на 4 пробела

    // Паттерны для различных типов маркеров списка
    const listMarkerPatterns = [
        /^[-•·▪▫‣⁃]\s+/,           // Тире и различные bullet points
        /^\d+[.)]\s+/,             // Нумерованные списки (1. 2) 3. и т.д.)
        /^[a-zA-Z][.)]\s+/,        // Буквенные маркеры (a. b) A. B) и т.д.)
        /^[ivx]+[.)]\s+/i,         // Римские цифры (i. ii) III. и т.д.)
        /^[♦▪▫‣⁃▸▹▻]\s+/,          // Специальные символы
        /^[*+]\s+/,                // Звездочки и плюсы
        /^>\s+/,                   // Цитаты
        /^\s*[-•·▪▫‣⁃]\s+/,        // Тире с возможными пробелами в начале
        /^\s*\d+[.)]\s+/,          // Нумерация с возможными пробелами
    ];

    let cleanedText = processedText;
    
    // Применяем все паттерны для очистки
    for (const pattern of listMarkerPatterns) {
        cleanedText = cleanedText.replace(pattern, '');
    }

    // Дополнительная очистка для многострочного текста
    if (cleanedText.includes('\n')) {
        const lines = cleanedText.split('\n');
        const cleanedLines = lines.map(line => {
            let cleanedLine = line;
            for (const pattern of listMarkerPatterns) {
                cleanedLine = cleanedLine.replace(pattern, '');
            }
            return cleanedLine;
        });
        cleanedText = cleanedLines.join('\n');
    }

    return cleanedText.trim();
};

/**
 * Проверяет, содержит ли текст маркеры списка
 */
export const hasListMarkers = (text: string): boolean => {
    if (typeof text !== 'string') {
        return false;
    }

    const listMarkerPatterns = [
        /^[-•·▪▫‣⁃]\s+/,
        /^\d+[.)]\s+/,
        /^[a-zA-Z][.)]\s+/,
        /^[ivx]+[.)]\s+/i,
        /^[♦▪▫‣⁃▸▹▻]\s+/,
        /^[*+]\s+/,
        /^>\s+/,
        /^\s*[-•·▪▫‣⁃]\s+/,
        /^\s*\d+[.)]\s+/,
    ];

    return listMarkerPatterns.some(pattern => pattern.test(text));
};
