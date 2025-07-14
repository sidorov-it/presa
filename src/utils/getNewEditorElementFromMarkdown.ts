import { getNewEditorElement } from './getNewEditorElement';
import { markdownToHtml } from './markdownToHtml';

export const getNewEditorElementFromMarkdown = (markdown: string, textType: string, textAlign?: string) => {
    const htmlContent = markdownToHtml(markdown);
    return getNewEditorElement(htmlContent, { textType, textAlign });
};
