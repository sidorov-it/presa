import { Extension } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';

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

export const CleanPasteExtension = Extension.create<{
    editor?: any;
}>({
    name: 'cleanPaste',
    addProseMirrorPlugins() {
        const editor = this.options.editor;
        return [
            new Plugin({
                props: {
                    handlePaste(view, event, _slice) {
                        const html = event.clipboardData?.getData('text/html');
                        if (html) {
                            console.log('Original HTML:', html);
                            const doc = new DOMParser().parseFromString(html, 'text/html');
                            sanitizeNode(doc.body);
                            const cleanHtml = doc.body.innerHTML;
                            console.log('Sanitized HTML:', cleanHtml);
                            if (editor && typeof editor.commands?.insertContent === 'function') {
                                console.log('Using editor.commands.insertContent');
                                editor.commands.insertContent(cleanHtml);
                            } else {
                                console.log('Fallback to document.execCommand');
                                // fallback: insert as plain text
                                document.execCommand('insertHTML', false, cleanHtml);
                            }
                            return true;
                        }
                        return false;
                    },
                },
            }),
        ];
    },
});
