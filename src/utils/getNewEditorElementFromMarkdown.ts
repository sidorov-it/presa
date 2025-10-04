import { getNewEditorElement } from './getNewEditorElement';
import { markdownToHtml } from './markdownToHtml';

/**
 * Helper function to detect if content has structured HTML that shouldn't be wrapped again
 */
const hasStructuredContent = (html: string): boolean => {
    // Check for heading spans, lists, blockquotes, or other structured elements
    return /<(span class="heading-text|ul|ol|blockquote|li)/i.test(html);
};

/**
 * Helper function to strip markdown syntax but preserve content
 */
const stripMarkdownSyntax = (text: string): string => {
    return text
        .replace(/^#{1,6}\s+/gm, '') // Remove heading markers
        .replace(/^\d+\.\s+/gm, '') // Remove numbered list markers
        .replace(/^-\s+/gm, '') // Remove bullet markers
        .replace(/^>\s+/gm, '') // Remove blockquote markers
        .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold markers
        .replace(/\*(.+?)\*/g, '$1') // Remove italic markers
        .replace(/\n/g, '<br />') // Convert line breaks to HTML breaks for plain text
        .trim();
};

export const getNewEditorElementFromMarkdown = (markdown: string, textType: string, textAlign?: string) => {
    // Handle empty content
    if (!markdown || markdown.trim() === '') {
        return getNewEditorElement('', { textType, textAlign });
    }

    // Обрабатываем экранированные переносы строк от LLM
    const normalizedMarkdown = markdown
        .replace(/\\n/g, '\n') // Заменяем \n на реальные переносы строк
        .replace(/\\r\\n/g, '\n') // Заменяем \r\n на переносы строк
        .replace(/\\t/g, '    '); // Заменяем \t на 4 пробела

    // Convert markdown to HTML
    const htmlContent = markdownToHtml(normalizedMarkdown);

    // If markdown produced structured content (headings, lists, etc.), don't wrap it again
    if (hasStructuredContent(htmlContent)) {
        return getNewEditorElement(htmlContent, { textAlign });
    }

    // For plain text or simple content, apply the slot's textType formatting
    const plainContent = stripMarkdownSyntax(normalizedMarkdown);
    return getNewEditorElement(plainContent, { textType, textAlign });
};
