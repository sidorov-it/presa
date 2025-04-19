import { FONT_SIZE_BIG_TEXT, FONT_SIZE_TITLE, FONT_SIZE_VERY_BIG_HEADING, FONT_SIZE_BIG_HEADING } from '@/consts';
import { FONT_SIZE_SMALL_TEXT } from '@/consts';
import { Extension } from '@tiptap/core';

export type FontSizeOptions = {
    types: string[];
};

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        fontSize: {
            /**
             * Set the font size
             */
            setFontSize: (fontSize: string) => ReturnType;
            /**
             * Unset the font size
             */
            unsetFontSize: () => ReturnType;
        };
    }
}

export const FontSizeExtension = Extension.create<FontSizeOptions>({
    name: 'fontSize',

    addOptions() {
        return {
            types: ['textStyle'],
        };
    },

    addAttributes() {
        return {
            class: {
                default: null,
                // Take the attribute values
                renderHTML: (attributes: any) => {
                    // … and return an object with HTML attributes.
                    return {
                        class: `${attributes.class}`,
                    }
                },
            },
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) {
                                return {};
                            }

                            let className;

                            if (!attributes.fontSize ||attributes.fontSize === FONT_SIZE_SMALL_TEXT || attributes.fontSize === FONT_SIZE_SMALL_TEXT || attributes.fontSize ===  FONT_SIZE_BIG_TEXT) {
                                className = 'body-text';
                            } else if (
                                attributes.fontSize === FONT_SIZE_TITLE
                                || attributes.fontSize === FONT_SIZE_BIG_HEADING
                                || attributes.fontSize === FONT_SIZE_VERY_BIG_HEADING
                            ) {
                                className = 'heading-text';
                            }

                            return {
                                style: `font-size: ${attributes.fontSize}`,
                                class: className,
                            };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setFontSize:
                fontSize =>
                    ({ chain }) => {
                        return chain().setMark('textStyle', { fontSize }).run();
                    },
            unsetFontSize:
                () =>
                    ({ chain }) => {
                        return chain()
                            .setMark('textStyle', { fontSize: null })
                            .removeEmptyTextStyle()
                            .run();
                    },
        };
    },
}); 