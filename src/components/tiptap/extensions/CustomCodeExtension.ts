/* eslint-disable prettier/prettier */
import { Mark, markInputRule, markPasteRule, mergeAttributes } from '@tiptap/core';

function getSizeClasses(fontSize: string) {
    switch (fontSize) {
        case '0.8em': // Small text
            return ['body-text', 'small-text'];
        case '1.125em': // Normal text
            return ['body-text', 'normal-text'];
        case '1.25em': // Big text or Heading 4
            return 'body-text big-text';
        case '1.5em': // Heading 3
            return ['heading-text', 'heading-3'];
        case '2em': // Heading 2
            return ['heading-text', 'heading-2'];
        case '2.5em': // Heading 1
            return ['heading-text', 'heading-1'];
        case '3.45em': // Title
            return ['heading-text', 'title-text'];
        case '5em': // Big heading
            return ['heading-text', 'big-heading'];
        case '7.5em': // Very big heading
            return ['heading-text', 'very-big-heading'];
        default:
            return '';
    }
}

export interface CodeOptions {
    /**
     * The HTML attributes applied to the code element.
     * @default {}
     * @example { class: 'foo' }
     */
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        code: {
            /**
             * Set a code mark
             */
            setCode: () => ReturnType;
            /**
             * Toggle inline code
             */
            toggleCode: () => ReturnType;
            /**
             * Unset a code mark
             */
            unsetCode: () => ReturnType;
        };
    }
}

/**
 * Regular expressions to match inline code blocks enclosed in backticks.
 *  It matches:
 *     - An opening backtick, followed by
 *     - Any text that doesn't include a backtick (captured for marking), followed by
 *     - A closing backtick.
 *  This ensures that any text between backticks is formatted as code,
 *  regardless of the surrounding characters (exception being another backtick).
 */
export const inputRegex = /(^|[^`])`([^`]+)`(?!`)/;

/**
 * Matches inline code while pasting.
 */
export const pasteRegex = /(^|[^`])`([^`]+)`(?!`)/g;

/**
 * This extension allows you to mark text as inline code.
 * @see https://tiptap.dev/api/marks/code
 */
export const Code = Mark.create<CodeOptions>({
    name: 'code',

    addOptions() {
        return {
            HTMLAttributes: {
                class: true,
            },
        };
    },

    excludes: '_',

    code: true,

    exitable: true,

    parseHTML() {
        return [{ tag: 'code' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['code', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },

    addCommands() {
        return {
            setCode:
                () =>
                    ({ commands }) => {
                        return commands.setMark(this.name);
                    },
            toggleCode:
                () =>
                    ({ commands, editor, state }) => {
                        const { from, to } = state.selection;
                        const isActive = editor.isActive('code');

                        if (isActive) {
                            return commands.toggleMark('code');
                        }

                        // Get the font size class from the surrounding textStyle mark
                        const marks = editor.getAttributes('textStyle');
                        let sizeClasses;

                        if (marks.fontSize?.hasOwnProperty('classList')) {
                            sizeClasses = marks.fontSize.classList.value.split(' ');
                        } else {
                            sizeClasses = marks.fontSize ? getSizeClasses(marks.fontSize) : [];
                        }

                        // First apply the code mark
                        const preparedClasses = ['custom-code', ...(Array.isArray(sizeClasses) ? sizeClasses : [sizeClasses])].filter(Boolean).join(' ');
                        const result = commands.toggleMark(this.name, {
                            class: preparedClasses
                        });

                        // Ensure the editor state is updated
                        editor.view.dispatch(editor.state.tr.setMeta('transaction', true));

                        console.log('finished toggle code');
                        return result;
                    },
            unsetCode:
                () =>
                    ({ commands }) => {
                        return commands.unsetMark(this.name);
                    },
        };
    },

    addKeyboardShortcuts() {
        return {
            'Mod-e': () => this.editor.commands.toggleCode(),
        };
    },

    addInputRules() {
        return [
            markInputRule({
                find: inputRegex,
                type: this.type,
            }),
        ];
    },

    addPasteRules() {
        return [
            markPasteRule({
                find: pasteRegex,
                type: this.type,
            }),
        ];
    },
});
