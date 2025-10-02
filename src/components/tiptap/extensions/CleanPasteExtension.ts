import { Extension } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';
import { DOMParser as ProseMirrorDOMParser } from 'prosemirror-model';

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'strike', 's', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'];
const ALLOWED_STYLES = ['color'];
const ALLOWED_CLASSES = [
    'body-text',
    'small-text',
    'big-text',
    'normal-text',
    'heading-4',
    'heading-3',
    'heading-2',
    'heading-1',
    'title-text',
    'big-heading',
    'very-big-heading',
    'heading-text',
    'heading-5',
];
const TAG_CLASS_MAP: Record<string, string[]> = {
    h1: ['heading-text', 'title-text'],
    h2: ['heading-text', 'heading-1'],
    h3: ['heading-text', 'heading-2'],
    h4: ['heading-text', 'heading-3'],
    h5: ['heading-text', 'heading-4'],
    h6: ['heading-text', 'heading-5'],
};

function sanitizeNode(node: HTMLElement) {
    Array.from(node.children).forEach(child => {
        const tag = child.tagName.toLowerCase();
        if (!ALLOWED_TAGS.includes(tag)) {
            // Replace with span and sanitize recursively
            const span = document.createElement('span');
            span.innerHTML = child.innerHTML;
            child.replaceWith(span);
            sanitizeNode(span);
        } else {
            // Clean styles
            if (child.hasAttribute('style')) {
                // Only keep allowed styles
                const style = child.getAttribute('style') || '';
                const allowedStyles: string[] = [];
                style.split(';').forEach(styleRule => {
                    const [key, value] = styleRule.split(':').map(s => s && s.trim());
                    if (key && value && ALLOWED_STYLES.includes(key)) {
                        allowedStyles.push(`${key}: ${value}`);
                    }
                });
                if (allowedStyles.length > 0) {
                    child.setAttribute('style', allowedStyles.join('; '));
                } else {
                    child.removeAttribute('style');
                }
            }
            // Clean classes
            let classList: string[] = [];
            if (child.hasAttribute('class')) {
                classList = child.getAttribute('class')!.split(' ').filter(Boolean);
                classList = classList.filter(cls => ALLOWED_CLASSES.includes(cls));
            }
            if (TAG_CLASS_MAP[tag]) {
                TAG_CLASS_MAP[tag].forEach(cls => {
                    if (!classList.includes(cls)) classList.push(cls);
                });
            }
            if (classList.length > 0) {
                child.setAttribute('class', classList.join(' '));
            } else if (TAG_CLASS_MAP[tag]) {
                child.setAttribute('class', TAG_CLASS_MAP[tag].join(' '));
            } else {
                // If no classes were assigned, add default classes
                child.setAttribute('class', 'body-text normal-text');
            }
            // Remove all other attributes except style and class
            Array.from(child.attributes).forEach(attr => {
                if (attr.name !== 'style' && attr.name !== 'class') {
                    child.removeAttribute(attr.name);
                }
            });
            sanitizeNode(child as HTMLElement);
        }
    });
}

function sanitizeHtml(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.body.querySelectorAll('[data-pm-slice]').forEach(wrapperNode => {
        if (!wrapperNode.parentNode) return;
        const parent = wrapperNode.parentNode as HTMLElement;
        while (wrapperNode.firstChild) {
            parent.insertBefore(wrapperNode.firstChild, wrapperNode);
        }
        parent.removeChild(wrapperNode);
    });

    sanitizeNode(doc.body);

    return doc.body.innerHTML;
}

export const CleanPasteExtension = Extension.create<{
    editor?: any;
}>({
    name: 'cleanPaste',
    addProseMirrorPlugins() {
        return [
            new Plugin({
                props: {
                    handlePaste(view, event) {
                        const html = event.clipboardData?.getData('text/html');
                        if (!html) {
                            return false;
                        }

                        const cleanHtml = sanitizeHtml(html);
                        if (!cleanHtml) {
                            return false;
                        }

                        event.preventDefault();

                        const parser =
                            (view.someProp('clipboardParser') as ProseMirrorDOMParser | null) ??
                            (view.someProp('domParser') as ProseMirrorDOMParser | null);

                        if (!parser) {
                            return false;
                        }

                        const container = document.createElement('div');
                        container.innerHTML = cleanHtml;

                        const slice = parser.parseSlice(container, { preserveWhitespace: 'full' });
                        const transaction = view.state.tr.replaceSelection(slice).setMeta('transaction', true);
                        view.dispatch(transaction.scrollIntoView());

                        return true;
                    },
                },
            }),
        ];
    },
});
