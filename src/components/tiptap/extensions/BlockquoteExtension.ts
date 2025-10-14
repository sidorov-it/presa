/* eslint-disable indent */
import { mergeAttributes, Node, wrappingInputRule } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface BlockquoteOptions {
    /**
     * HTML attributes to add to the blockquote element
     * @default {}
     * @example { class: 'foo' }
     */
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        blockQuote: {
            /**
             * Set a blockquote node
             */
            setBlockquote: () => ReturnType;
            /**
             * Toggle a blockquote node
             */
            toggleBlockquote: () => ReturnType;
            /**
             * Unset a blockquote node
             */
            unsetBlockquote: () => ReturnType;
        };
    }
}

/**
 * Matches a blockquote to a `>` as input.
 */
export const inputRegex = /^\s*>\s$/;

/**
 * This extension allows you to create blockquotes.
 * @see https://tiptap.dev/api/nodes/blockquote
 */
export const BlockquoteExtension = Node.create<BlockquoteOptions>({
    name: 'blockquote',

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    content: 'block+',

    group: 'block',

    defining: true,

    parseHTML() {
        return [{ tag: 'blockquote' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['blockquote', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'blockquote' }), 0];
    },

    addCommands() {
        return {
            setBlockquote:
                () =>
                ({ commands }) => {
                    return commands.wrapIn(this.name);
                },
            toggleBlockquote:
                () =>
                ({ commands }) => {
                    return commands.toggleWrap(this.name);
                },
            unsetBlockquote:
                () =>
                ({ commands }) => {
                    return commands.lift(this.name);
                },
        };
    },

    addKeyboardShortcuts() {
        return {
            'Mod-Shift-b': () => this.editor.commands.toggleBlockquote(),
            Backspace: () => {
                const { state } = this.editor;
                const { selection } = state;
                const { $from, $to, empty } = selection;

                // Проверяем, находимся ли мы внутри blockquote
                let blockquoteDepth = -1;
                for (let i = $from.depth; i > 0; i--) {
                    if ($from.node(i).type.name === 'blockquote') {
                        blockquoteDepth = i;
                        break;
                    }
                }

                if (blockquoteDepth === -1) {
                    return false;
                }

                const blockquote = $from.node(blockquoteDepth);

                // Если выделен текст
                if (!empty) {
                    const blockquoteStart = $from.start(blockquoteDepth);
                    const blockquoteEnd = $from.end(blockquoteDepth);
                    const selectionStart = $from.pos;
                    const selectionEnd = $to.pos;

                    // Проверяем, выделено ли всё содержимое blockquote
                    const isAllContentSelected =
                        selectionStart <= blockquoteStart && selectionEnd >= blockquoteEnd;

                    if (isAllContentSelected) {
                        // Удаляем весь текст, но оставляем пустой параграф внутри blockquote
                        return this.editor.commands.command(({ tr, state, dispatch }) => {
                            if (dispatch) {
                                const blockquotePos = $from.before(blockquoteDepth);
                                const paragraph = state.schema.nodes.paragraph;
                                
                                // Очищаем содержимое blockquote и вставляем пустой параграф
                                tr.delete(blockquoteStart, blockquoteEnd);
                                tr.insert(blockquoteStart, paragraph.create());
                                
                                // Устанавливаем курсор в начало нового параграфа
                                tr.setSelection(state.selection.constructor.near(tr.doc.resolve(blockquoteStart + 1)));
                            }
                            return true;
                        });
                    }
                }

                // Проверяем, находимся ли мы в начале blockquote
                const isAtStart = $from.parentOffset === 0 && $from.pos === $from.start(blockquoteDepth);
                
                if (!isAtStart) {
                    return false;
                }

                // Проверяем, пустой ли blockquote
                const blockquoteContent = blockquote.textContent.trim();
                const isBlockquoteEmpty = blockquoteContent === '';

                // Если blockquote пустой и мы в начале - удаляем весь blockquote
                if (isBlockquoteEmpty && empty) {
                    return this.editor.commands.lift(this.name);
                }

                // В остальных случаях позволяем стандартное поведение
                return false;
            },
            Delete: () => {
                const { state } = this.editor;
                const { selection } = state;
                const { $from, $to, empty } = selection;

                // Проверяем, находимся ли мы внутри blockquote
                let blockquoteDepth = -1;
                for (let i = $from.depth; i > 0; i--) {
                    if ($from.node(i).type.name === 'blockquote') {
                        blockquoteDepth = i;
                        break;
                    }
                }

                if (blockquoteDepth === -1) {
                    return false;
                }

                // Если выделен текст
                if (!empty) {
                    const blockquoteStart = $from.start(blockquoteDepth);
                    const blockquoteEnd = $from.end(blockquoteDepth);
                    const selectionStart = $from.pos;
                    const selectionEnd = $to.pos;

                    // Проверяем, выделено ли всё содержимое blockquote
                    const isAllContentSelected =
                        selectionStart <= blockquoteStart && selectionEnd >= blockquoteEnd;

                    if (isAllContentSelected) {
                        // Удаляем весь текст, но оставляем пустой параграф внутри blockquote
                        return this.editor.commands.command(({ tr, state, dispatch }) => {
                            if (dispatch) {
                                const paragraph = state.schema.nodes.paragraph;
                                
                                // Очищаем содержимое blockquote и вставляем пустой параграф
                                tr.delete(blockquoteStart, blockquoteEnd);
                                tr.insert(blockquoteStart, paragraph.create());
                                
                                // Устанавливаем курсор в начало нового параграфа
                                tr.setSelection(state.selection.constructor.near(tr.doc.resolve(blockquoteStart + 1)));
                            }
                            return true;
                        });
                    }
                }

                // В остальных случаях позволяем стандартное поведение
                return false;
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            // Плагин для обработки ввода текста при выделении всего содержимого blockquote
            new Plugin({
                key: new PluginKey('blockquoteInputHandler'),
                props: {
                    handleTextInput: (view, from, to, text) => {
                        const { state } = view;
                        const { $from, $to } = state.selection;

                        // Проверяем, находимся ли мы внутри blockquote
                        let blockquoteDepth = -1;
                        for (let i = $from.depth; i > 0; i--) {
                            if ($from.node(i).type.name === 'blockquote') {
                                blockquoteDepth = i;
                                break;
                            }
                        }

                        if (blockquoteDepth === -1) {
                            return false;
                        }

                        const blockquoteStart = $from.start(blockquoteDepth);
                        const blockquoteEnd = $from.end(blockquoteDepth);

                        // Проверяем, выделено ли всё содержимое blockquote
                        const isAllContentSelected = from <= blockquoteStart && to >= blockquoteEnd;

                        if (isAllContentSelected) {
                            const { tr } = state;
                            const paragraph = state.schema.nodes.paragraph;

                            // Очищаем содержимое blockquote
                            tr.delete(blockquoteStart, blockquoteEnd);
                            
                            // Вставляем новый параграф с вводимым текстом
                            const textNode = state.schema.text(text);
                            const newParagraph = paragraph.create(null, textNode);
                            tr.insert(blockquoteStart, newParagraph);
                            
                            // Устанавливаем курсор после введённого текста
                            tr.setSelection(
                                state.selection.constructor.near(tr.doc.resolve(blockquoteStart + text.length + 1))
                            );

                            view.dispatch(tr);
                            return true;
                        }

                        return false;
                    },
                },
            }),
        ];
    },

    addInputRules() {
        return [
            wrappingInputRule({
                find: inputRegex,
                type: this.type,
            }),
        ];
    },
});
