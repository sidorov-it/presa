import { Extension } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';
import { Slice, Fragment } from 'prosemirror-model';
import { NORMAL_TEXT_LEVEL } from '@/constants/consts';

/**
 * Extracts plain text from HTML, preserving basic structure like line breaks
 */
function extractPlainText(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove script and style tags completely
    doc.querySelectorAll('script, style').forEach(el => el.remove());

    // Replace block elements with line breaks
    doc.querySelectorAll('br, p, div, h1, h2, h3, h4, h5, h6, li').forEach(el => {
        const textNode = document.createTextNode('\n');
        el.appendChild(textNode);
    });

    // Get text content and normalize whitespace
    let text = doc.body.textContent || '';

    // Normalize line breaks (replace multiple consecutive line breaks with double line break)
    text = text.replace(/\n{3,}/g, '\n\n');

    // Trim each line
    text = text
        .split('\n')
        .map(line => line.trim())
        .join('\n');

    // Remove leading/trailing whitespace
    text = text.trim();

    return text;
}

export const CleanPasteExtension = Extension.create<{
    editor?: any;
}>({
    name: 'cleanPaste',
    addProseMirrorPlugins() {
        const editor = this.editor;
        
        return [
            new Plugin({
                props: {
                    handlePaste(view, event) {
                        const html = event.clipboardData?.getData('text/html');
                        const plainText = event.clipboardData?.getData('text/plain');

                        // If there's no HTML content, let default handler handle plain text
                        if (!html) {
                            return false;
                        }

                        event.preventDefault();

                        // Extract plain text from HTML
                        const text = extractPlainText(html) || plainText || '';

                        if (!text) {
                            return false;
                        }

                        const { state, dispatch } = view;
                        const { tr, schema, selection } = state;

                        // Get current active marks at cursor position to apply to pasted text
                        const { $from } = selection;
                        let activeMarks = $from.marks();

                        // If there are no active marks, get stored styles from CustomPlaceholderExtension
                        if (activeMarks.length === 0) {
                            const storedStyle = editor?.storage?.customPlaceholder?.storedStyle || {
                                level: NORMAL_TEXT_LEVEL,
                                color: null,
                                bold: false,
                                italic: false,
                                underline: false,
                                strike: false,
                            };

                            const marks: any[] = [];

                            // Create textStyle mark with fontSize and class
                            const textStyleAttrs: any = {
                                fontSize: `${storedStyle.level}px`,
                                class: 'body-text normal-text',
                            };

                            if (storedStyle.color) {
                                textStyleAttrs.color = storedStyle.color;
                            }

                            if (schema.marks.textStyle) {
                                marks.push(schema.marks.textStyle.create(textStyleAttrs));
                            }

                            // Add other marks
                            if (storedStyle.bold && schema.marks.bold) {
                                marks.push(schema.marks.bold.create());
                            }
                            if (storedStyle.italic && schema.marks.italic) {
                                marks.push(schema.marks.italic.create());
                            }
                            if (storedStyle.underline && schema.marks.underline) {
                                marks.push(schema.marks.underline.create());
                            }
                            if (storedStyle.strike && schema.marks.strike) {
                                marks.push(schema.marks.strike.create());
                            }

                            activeMarks = marks;
                        }

                        // Split text by line breaks to create separate paragraphs
                        const lines = text.split('\n').filter(line => line.length > 0);

                        if (lines.length === 0) {
                            return true;
                        }

                        // Build content nodes with active marks
                        const nodes: any[] = [];

                        lines.forEach(line => {
                            // Create text node with active marks
                            const textNode = schema.text(line, activeMarks);

                            // Wrap in paragraph
                            const paragraphNode = schema.nodes.paragraph.create(null, textNode);
                            nodes.push(paragraphNode);
                        });

                        // Create a fragment from nodes
                        const fragment = Fragment.from(nodes);
                        const slice = new Slice(fragment, 0, 0);

                        // Insert the slice at current selection
                        const transaction = tr.replaceSelection(slice).setMeta('transaction', true);
                        dispatch(transaction.scrollIntoView());

                        return true;
                    },
                },
            }),
        ];
    },
});
