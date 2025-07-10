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

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line) {
            closeList();
            // htmlParts.push('<br />');
            continue;
        }

        // Headings ###, ##, # (only up to level-3 is required by spec)
        if (/^###\s+/.test(line)) {
            closeList();
            htmlParts.push(
                `<span class="heading-text heading-3">${applyInlineFormatting(line.replace(/^###\s+/, ''))}</span>`
            );
            continue;
        }
        if (/^##\s+/.test(line)) {
            closeList();
            htmlParts.push(
                `<span class="heading-text heading-2">${applyInlineFormatting(line.replace(/^##\s+/, ''))}</span>`
            );
            continue;
        }
        if (/^#\s+/.test(line)) {
            closeList();
            htmlParts.push(
                `<span class="heading-text heading-1">${applyInlineFormatting(line.replace(/^#\s+/, ''))}</span>`
            );
            continue;
        }

        // Block quote
        if (/^>\s+/.test(line)) {
            closeList();
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
        closeList();
        htmlParts.push(`${applyInlineFormatting(line)}`);
    }

    // Close any open list at EOF
    closeList();

    return htmlParts.join('\n');
};
