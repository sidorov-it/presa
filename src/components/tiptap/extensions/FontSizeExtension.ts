/* eslint-disable prettier/prettier */
import {
    FONT_SIZE_BIG_TEXT,
    FONT_SIZE_TITLE,
    FONT_SIZE_VERY_BIG_HEADING,
    FONT_SIZE_BIG_HEADING,
    HEADING_4_LEVEL,
    BIG_HEADING_LEVEL,
    BIG_TEXT_LEVEL,
    HEADING_1_LEVEL,
    HEADING_2_LEVEL,
    HEADING_3_LEVEL,
    NORMAL_TEXT_LEVEL,
    SMALL_TEXT_LEVEL,
    TITLE_LEVEL,
    VERY_BIG_HEADING_LEVEL,
    FONT_SIZE_HEADING_4,
    FONT_SIZE_HEADING_3,
    FONT_SIZE_HEADING_1,
    FONT_SIZE_HEADING_2,
} from '@/consts';
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
            setFontSize: (fontLevel: number) => ReturnType;
            /**
             * Unset the font size
             */
            unsetFontSize: () => ReturnType;
        };
    }
}

const fontSizeMapping = [
    {
        fontSize: FONT_SIZE_SMALL_TEXT,
        className: 'small-text',
    },
    {
        fontSize: FONT_SIZE_BIG_TEXT,
        className: 'big-text',
    },
    {
        fontSize: FONT_SIZE_HEADING_4, // Heading 4
        className: 'heading-4',
    },
    {
        fontSize: FONT_SIZE_HEADING_3, // Heading 3
        className: 'heading-3',
    },
    {
        fontSize: FONT_SIZE_HEADING_2, // Heading 2
        className: 'heading-2',
    },
    {
        fontSize: FONT_SIZE_HEADING_1, // Heading 1
        className: 'heading-1',
    },
    {
        fontSize: FONT_SIZE_TITLE,
        className: 'title-text',
    },
    {
        fontSize: FONT_SIZE_BIG_HEADING,
        className: 'big-heading',
    },
    {
        fontSize: FONT_SIZE_VERY_BIG_HEADING,
        className: 'very-big-heading',
    },
    {
        fontSize: null,
        className: 'body-text normal-text',
    },
];

export const FontSizeExtension = Extension.create<FontSizeOptions>({
    name: 'fontSize',

    addOptions() {
        return {
            types: ['textStyle'],
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => {
                            // Try to extract fontSize from style attribute or custom data attribute
                            const dataFontSize = element.getAttribute('data-font-size');
                            // if (dataFontSize) return dataFontSize;

                            const classList = element.classList;
                            // if (classList) return classList;

                            let fontSize;
                            if (!dataFontSize) {
                                const classes = classList.value.split(' ');

                                const fontSizeInfo = fontSizeMapping.find(mapping =>
                                    classes.includes(mapping.className)
                                );

                                if (fontSizeInfo) {
                                    fontSize = fontSizeInfo.fontSize;
                                }
                            }

                            return {
                                dataFontSize,
                                fontSize,
                                classList,
                            };
                            // return element.style.fontSize?.replace(/['"]+/g, '');
                        },
                        renderHTML: attributes => {
                            if (typeof attributes.fontSize === 'string' && !attributes.fontSize) {
                                return {};
                            }

                            if (
                                attributes.fontSize &&
                                !(typeof attributes.fontSize === 'string') &&
                                !attributes.fontSize.fontSize &&
                                !attributes.fontSize.classList
                            ) {
                                return {};
                            }

                            let className;

                            const fontSize =
                                typeof attributes.fontSize === 'string'
                                    ? attributes.fontSize
                                    : attributes.fontSize?.fontSize;

                            if (fontSize) {
                                switch (fontSize) {
                                    case FONT_SIZE_SMALL_TEXT:
                                        className = 'body-text small-text';
                                        break;
                                    case FONT_SIZE_BIG_TEXT:
                                        className = 'body-text big-text';
                                        break;
                                    case FONT_SIZE_HEADING_4: // Heading 4
                                        className = 'heading-text heading-4';
                                        break;
                                    case FONT_SIZE_HEADING_3: // Heading 3
                                        className = 'heading-text heading-3';
                                        break;
                                    case FONT_SIZE_HEADING_2: // Heading 2
                                        className = 'heading-text heading-2';
                                        break;
                                    case FONT_SIZE_HEADING_1: // Heading 1
                                        className = 'heading-text heading-1';
                                        break;
                                    case FONT_SIZE_TITLE:
                                        className = 'heading-text title-text';
                                        break;
                                    case FONT_SIZE_BIG_HEADING:
                                        className = 'heading-text big-heading';
                                        break;
                                    case FONT_SIZE_VERY_BIG_HEADING:
                                        className = 'heading-text very-big-heading';
                                        break;
                                    default:
                                        className = 'body-text normal-text';
                                        break;
                                }
                            }

                            if (attributes.fontSize?.classList) {
                                className = attributes.fontSize.classList.toString();
                            }

                            return {
                                // style: `font-size: ${attributes.fontSize}`,
                                class: className,
                                // 'data-font-size': attributes.fontSize,
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
                        let fontSizeValue;

                        switch (fontSize) {
                            case SMALL_TEXT_LEVEL:
                                fontSizeValue = FONT_SIZE_SMALL_TEXT;
                                break;
                            case NORMAL_TEXT_LEVEL:
                                fontSizeValue = null; // Default font size
                                break;
                            case BIG_TEXT_LEVEL:
                                fontSizeValue = FONT_SIZE_BIG_TEXT;
                                break;
                            case HEADING_4_LEVEL:
                                fontSizeValue = FONT_SIZE_HEADING_4; // Heading 4 size
                                break;
                            case HEADING_3_LEVEL:
                                fontSizeValue = FONT_SIZE_HEADING_3; // Heading 3 size
                                break;
                            case HEADING_2_LEVEL:
                                fontSizeValue = FONT_SIZE_HEADING_2; // Heading 2 size
                                break;
                            case HEADING_1_LEVEL:
                                fontSizeValue = FONT_SIZE_HEADING_1; // Heading 1 size
                                break;
                            case TITLE_LEVEL:
                                fontSizeValue = FONT_SIZE_TITLE;
                                break;
                            case BIG_HEADING_LEVEL:
                                fontSizeValue = FONT_SIZE_BIG_HEADING;
                                break;
                            case VERY_BIG_HEADING_LEVEL:
                                fontSizeValue = FONT_SIZE_VERY_BIG_HEADING;
                                break;
                            default:
                                fontSizeValue = null;
                        }

                        // Only set the font size mark without changing the block type
                        return chain().focus().setMark('textStyle', { fontSize: fontSizeValue }).run();
                    },
            unsetFontSize:
                () =>
                    ({ chain }) => {
                        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
                    },
        };
    },
});
