/* eslint-disable prettier/prettier */
import { Extension } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        customPlaceholder: {
            /**
             * Update the placeholder style
             */
            updatePlaceholderStyle: (style: StoredStyle) => ReturnType;
        };
    }
}
import { NORMAL_TEXT_LEVEL } from '@/constants/consts';

export interface CustomPlaceholderOptions {
    placeholder: string;
    showOnlyWhenEditable?: boolean;
    showOnlyCurrent?: boolean;
    includeChildren?: boolean;
    initialStyle?: StoredStyle;
}

export interface StoredStyle {
    level: number;
    color: string | null;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
}



// Helper function to lighten a color
const lightenColor = (color: string | null): string => {
    if (!color) {
        return 'color-mix(in srgb, var(--presentation-text-color) 60%, transparent)';
    }

    // Handle CSS color variables
    if (color.startsWith('var(')) {
        return `color-mix(in srgb, ${color} 60%, transparent)`;
    }

    // Handle hex colors
    if (color.startsWith('#')) {
        return `color-mix(in srgb, ${color} 60%, transparent)`;
    }

    // Handle rgb/rgba colors
    if (color.startsWith('rgb')) {
        return `color-mix(in srgb, ${color} 60%, transparent)`;
    }

    // Fallback for named colors
    return `color-mix(in srgb, ${color} 60%, transparent)`;
};

export const CustomPlaceholderExtension = Extension.create<CustomPlaceholderOptions>({
    name: 'customPlaceholder',

    addOptions() {
        return {
            placeholder: 'Введите текст...',
            showOnlyWhenEditable: true,
            showOnlyCurrent: true,
            includeChildren: false,
            initialStyle: undefined,
        };
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                props: {
                    decorations: ({ doc }) => {
                        const active = this.editor.isEditable || !this.options.showOnlyWhenEditable;

                        if (!active) {
                            return DecorationSet.empty;
                        }

                        const decorations: Decoration[] = [];

                        // Check if editor is completely empty
                        const isEmpty = doc.content.size === 0 ||
                            (doc.content.size === 2 && doc.content.firstChild?.isTextblock && doc.content.firstChild.content.size === 0) ||
                            // Check for documents that only contain empty paragraphs with trailing breaks
                            (doc.content.childCount === 1 &&
                             doc.content.firstChild?.type.name === 'paragraph' &&
                             doc.content.firstChild.content.size === 0);

                        if (isEmpty) {
                            // Get stored styles from the editor's meta or a global store
                            const storedStyle = this.editor.storage.customPlaceholder?.storedStyle as StoredStyle || {
                                level: NORMAL_TEXT_LEVEL,
                                color: null,
                                bold: false,
                                italic: false,
                                underline: false,
                                strike: false,
                            };

                            // Build style attributes (without font-size since it's inherited from editor)
                            const color = lightenColor(storedStyle.color);

                            let style = `color: ${color};`;

                            if (storedStyle.bold) {
                                style += ' font-weight: bold;';
                            }
                            if (storedStyle.italic) {
                                style += ' font-style: italic;';
                            }
                            if (storedStyle.underline) {
                                style += ' text-decoration: underline;';
                            }
                            if (storedStyle.strike) {
                                style += ' text-decoration: line-through;';
                            }
                            if (storedStyle.underline && storedStyle.strike) {
                                style += ' text-decoration: underline line-through;';
                            }

                            const decoration = Decoration.widget(0, () => {
                                const placeholder = document.createElement('span');
                                placeholder.className = 'placeholder-text';
                                placeholder.style.cssText = style + 'position: absolute; pointer-events: none; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; display: block;';
                                placeholder.textContent = this.options.placeholder;

                                // Ensure the placeholder doesn't interfere with editor functionality
                                placeholder.setAttribute('data-placeholder', 'true');

                                return placeholder;
                            }, {
                                side: 1,
                                marks: [],
                            });

                            decorations.push(decoration);
                        }

                        return DecorationSet.create(doc, decorations);
                    },
                },
            }),
        ];
    },

    addStorage() {
        return {
            storedStyle: this.options.initialStyle || {
                level: NORMAL_TEXT_LEVEL,
                color: null,
                bold: false,
                italic: false,
                underline: false,
                strike: false,
            } as StoredStyle,
        };
    },

    addCommands() {
        return {
            updatePlaceholderStyle: (style: StoredStyle) => () => {
                this.storage.storedStyle = { ...style };
                // Force re-render of decorations
                this.editor.view.updateState(this.editor.state);
                return true;
            },
        };
    },
});