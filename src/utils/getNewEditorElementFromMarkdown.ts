import { getNewEditorElement } from './getNewEditorElement';
import { markdownToHtml } from './markdownToHtml';

export const getNewEditorElementFromMarkdown = (markdown: string) => {
    const htmlContent = markdownToHtml(markdown);
    return getNewEditorElement(htmlContent);
};
