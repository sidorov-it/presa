/* eslint-disable prettier/prettier */
import { Mark, mergeAttributes } from '@tiptap/core';

export interface TextStyleOptions {
    /**
     * HTML attributes to add to the span element.
     * @default {}
     * @example { class: 'foo' }
     */
    HTMLAttributes: Record<string, any>;
    /**
     * When enabled, merges the styles of nested spans into the child span during HTML parsing.
     * This prioritizes the style of the child span.
     * Used when parsing content created in other editors.
     * (Fix for ProseMirror's default behavior.)
     * @default false
     */
    mergeNestedSpanStyles: boolean;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        textStyle: {
            /**
             * Remove spans without inline style attributes.
             * @example editor.commands.removeEmptyTextStyle()
             */
            removeEmptyTextStyle: () => ReturnType;
        };
    }
}

const mergeNestedSpanStyles = (element: HTMLElement) => {
    if (!element.children.length) {
        return;
    }
    const childSpans = element.querySelectorAll('span');

    if (!childSpans) {
        return;
    }

    childSpans.forEach(childSpan => {
        const childStyle = childSpan.getAttribute('style');
        const closestParentSpanStyleOfChild = childSpan.parentElement?.closest('span')?.getAttribute('style');

        childSpan.setAttribute('style', `${closestParentSpanStyleOfChild};${childStyle}`);
    });
};

/**
 * This extension allows you to create text styles. It is required by default
 * for the `textColor` and `backgroundColor` extensions.
 * @see https://www.tiptap.dev/api/marks/text-style
 */
export const TextStyle = Mark.create<TextStyleOptions>({
    name: 'textStyle',

    priority: 101,

    keepOnSplit: true,

    addOptions() {
        return {
            HTMLAttributes: {},
            mergeNestedSpanStyles: false,
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span',
                getAttrs: element => {
                    const hasStyles = (element as HTMLElement).hasAttribute('style');
                    const hasClass = (element as HTMLElement).hasAttribute('class');

                    // Всегда возвращаем атрибуты, даже если span пустой
                    // Это позволяет сохранить пустые span'ы с классами
                    const result: any = {
                        class: (element as HTMLElement).className || null,
                    };

                    // Добавляем поддержку цвета из style атрибута
                    const styleAttr = (element as HTMLElement).getAttribute('style');
                    if (styleAttr) {
                        const colorMatch = styleAttr.match(/color:\s*([^;]+)/);
                        if (colorMatch) {
                            result.color = colorMatch[1].trim();
                        }
                    }

                    if (hasStyles && this.options.mergeNestedSpanStyles) {
                        mergeNestedSpanStyles(element as HTMLElement);
                    }

                    // Возвращаем результат даже для пустых span'ов с классами
                    return hasClass || hasStyles ? result : false;
                },
            },
        ];
    },

        renderHTML({ HTMLAttributes }) {
        const attrs: any = { ...HTMLAttributes };

        // Если есть color атрибут, добавляем его в style
        if (attrs.color) {
            const style = attrs.style || '';
            attrs.style = style ? `${style}; color: ${attrs.color}` : `color: ${attrs.color}`;
            delete attrs.color; // Удаляем color атрибут, так как он теперь в style
        }

        return ['span', mergeAttributes(this.options.HTMLAttributes, attrs), 0];
    },

    addCommands() {
        return {
            removeEmptyTextStyle:
                () =>
                    ({ tr }) => {
                        const { selection } = tr;
                        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
                            if (node.isTextblock) {
                                return true;
                            }

                            if (
                                !node.marks
                                    .filter(mark => mark.type === this.type)
                                    .some(mark => Object.values(mark.attrs).some(value => !!value))
                            ) {
                                tr.removeMark(pos, pos + node.nodeSize, this.type);
                            }
                        });
                        return true;
                    },
        };
    },
});
