// No external dependencies are required
// Utility to convert limited Markdown (#, ##, ###, **bold**, *italic*, lists, quotes) to HTML
// that TipTap editor can consume. It intentionally supports only the subset required by
// the LLM generation rules and avoids bringing extra dependencies.

export const markdownToHtml = (raw: string): string => {
    const normalized = raw.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');

    const htmlParts: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const closeList = () => {
        if (listType) {
            htmlParts.push(`</${listType}>`);
            listType = null;
        }
    };

    const applyInlineFormatting = (input: string): string => {
        // Bold **text**
        let formatted = input.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italic *text*
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        return formatted;
    };

    let hasEmptyLine = false; // Флаг для отслеживания пустых строк

    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = rawLine.trim();

        if (!line) {
            // Пустая строка - отмечаем флаг, но не добавляем сразу
            hasEmptyLine = true;
            continue;
        }

        // Если была пустая строка и теперь есть контент, добавляем разделитель
        if (hasEmptyLine && htmlParts.length > 0) {
            htmlParts.push('<br />');
            hasEmptyLine = false;
        }

        // Закрываем список если начинается не список
        const isListItem = /^\d+\.\s+/.test(line) || /^-\s+/.test(line);
        if (!isListItem) {
            closeList();
        }

        // Headings ###, ##, # (only up to level-3 is required by spec)
        if (/^###\s+/.test(line)) {
            htmlParts.push(
                `<span class="heading-text heading-3">${applyInlineFormatting(line.replace(/^###\s+/, ''))}</span>`
            );
            continue;
        }
        if (/^##\s+/.test(line)) {
            htmlParts.push(
                `<span class="heading-text heading-2">${applyInlineFormatting(line.replace(/^##\s+/, ''))}</span>`
            );
            continue;
        }
        if (/^#\s+/.test(line)) {
            htmlParts.push(
                `<span class="heading-text heading-1">${applyInlineFormatting(line.replace(/^#\s+/, ''))}</span>`
            );
            continue;
        }

        // Block quote
        if (/^>\s+/.test(line)) {
            htmlParts.push(`<blockquote>${applyInlineFormatting(line.replace(/^>\s+/, ''))}</blockquote>`);
            continue;
        }

        // Ordered list (e.g. "1. text")
        if (/^\d+\.\s+/.test(line)) {
            if (listType !== 'ol') {
                closeList();
                listType = 'ol';
                htmlParts.push('<ol>');
            }
            htmlParts.push(`<li>${applyInlineFormatting(line.replace(/^\d+\.\s+/, ''))}</li>`);
            continue;
        }

        // Unordered list (e.g. "- text")
        if (/^-\s+/.test(line)) {
            if (listType !== 'ul') {
                closeList();
                listType = 'ul';
                htmlParts.push('<ul>');
            }
            htmlParts.push(`<li>${applyInlineFormatting(line.replace(/^-\s+/, ''))}</li>`);
            continue;
        }

        // Default paragraph line
        htmlParts.push(applyInlineFormatting(line));
    }

    // Close any open list at EOF
    closeList();

    // Склеиваем без автоматических <br /> между всеми элементами
    let result = '';
    for (let i = 0; i < htmlParts.length; i++) {
        const part = htmlParts[i];
        
        if (i > 0) {
            const prevPart = htmlParts[i - 1];
            
            // Не добавляем <br /> в следующих случаях:
            // - После открывающего тега списка
            // - Перед закрывающим тегом списка
            // - Между элементами списка
            // - Если текущий элемент уже <br />
            if (part === '<br />') {
                result += part;
            } else if (prevPart === '<br />') {
                result += part;
            } else if (prevPart === '<ul>' || prevPart === '<ol>') {
                result += part;
            } else if (part === '</ul>' || part === '</ol>') {
                result += part;
            } else if (prevPart.startsWith('<li>') && part.startsWith('<li>')) {
                result += part;
            } else {
                result += '<br />' + part;
            }
        } else {
            result += part;
        }
    }

    return result;
};
