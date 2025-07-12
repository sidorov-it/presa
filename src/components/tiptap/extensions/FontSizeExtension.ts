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
} from '@/constants/consts';
import { FONT_SIZE_SMALL_TEXT } from '@/constants/consts';
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
            /**
             * Get the last used font level
             */
            getLastFontLevel: () => ReturnType;
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

    addStorage() {
        return {
            lastLevel: NORMAL_TEXT_LEVEL,
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        keepOnSplit: true,
                        parseHTML: element => {
                            // Try to extract fontSize from style attribute or custom data attribute
                            const dataFontSize = element.getAttribute('data-font-size');
                            
                            const classList = element.classList;
                            
                            // Если есть классы, всегда сохраняем их
                            if (classList && classList.length > 0) {
                                const classes = Array.from(classList);
                                
                                // Пытаемся найти соответствующий fontSize по классам
                                let fontSize;
                                if (!dataFontSize) {
                                    const fontSizeInfo = fontSizeMapping.find(mapping => {
                                        // Проверяем, содержит ли элемент нужные классы
                                        if (mapping.className.includes(' ')) {
                                            // Для составных классов (например, 'heading-text heading-3')
                                            const mappingClasses = mapping.className.split(' ');
                                            return mappingClasses.every(cls => classes.includes(cls));
                                        } else {
                                            // Для одиночных классов
                                            return classes.includes(mapping.className);
                                        }
                                    });

                                    if (fontSizeInfo) {
                                        fontSize = fontSizeInfo.fontSize;
                                    }
                                }

                                // Всегда возвращаем результат если есть классы, даже если fontSize не найден
                                return {
                                    dataFontSize,
                                    fontSize,
                                    classList,
                                    // Добавляем флаг, что классы были взяты из HTML
                                    preserveOriginalClasses: true,
                                };
                            }

                            // Если нет классов, возвращаем null чтобы не создавать пустой textStyle mark
                            return null;
                        },
                        renderHTML: attributes => {
                            // Сначала проверяем, есть ли уже классы из парсинга HTML и флаг preserveOriginalClasses
                            if (attributes.fontSize?.classList && attributes.fontSize?.preserveOriginalClasses) {
                                return {
                                    class: attributes.fontSize.classList.toString(),
                                };
                            }

                            // Если есть classList без preserveOriginalClasses, но с fontSize undefined,
                            // это означает, что мы не смогли определить fontSize по классам,
                            // но классы все равно должны быть сохранены
                            if (attributes.fontSize?.classList && attributes.fontSize?.fontSize === undefined) {
                                return {
                                    class: attributes.fontSize.classList.toString(),
                                };
                            }

                            // Гарантируем, что для обычного текста всегда возвращается класс 'body-text normal-text'
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
                            } else {
                                // Если fontSize не задан — это обычный текст
                                className = 'body-text normal-text';
                            }

                            return {
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
                (fontLevel: number) =>
                    ({ commands }) => {
                        // Store the last used font level
                        this.storage.lastLevel = fontLevel;

                        const fontSizeInfo = fontSizeMapping.find(mapping => {
                            switch (fontLevel) {
                                case SMALL_TEXT_LEVEL:
                                    return mapping.fontSize === FONT_SIZE_SMALL_TEXT;
                                case BIG_TEXT_LEVEL:
                                    return mapping.fontSize === FONT_SIZE_BIG_TEXT;
                                case HEADING_4_LEVEL:
                                    return mapping.fontSize === FONT_SIZE_HEADING_4;
                                case HEADING_3_LEVEL:
                                    return mapping.fontSize === FONT_SIZE_HEADING_3;
                                case HEADING_2_LEVEL:
                                    return mapping.fontSize === FONT_SIZE_HEADING_2;
                                case HEADING_1_LEVEL:
                                    return mapping.fontSize === FONT_SIZE_HEADING_1;
                                case TITLE_LEVEL:
                                    return mapping.fontSize === FONT_SIZE_TITLE;
                                case BIG_HEADING_LEVEL:
                                    return mapping.fontSize === FONT_SIZE_BIG_HEADING;
                                case VERY_BIG_HEADING_LEVEL:
                                    return mapping.fontSize === FONT_SIZE_VERY_BIG_HEADING;
                                case NORMAL_TEXT_LEVEL:
                                default:
                                    return mapping.fontSize === null;
                            }
                        });

                        if (fontSizeInfo) {
                            return commands.setMark('textStyle', {
                                fontSize: fontSizeInfo.fontSize,
                            });
                        }

                        return false;
                    },
            unsetFontSize:
                () =>
                    ({ commands }) => {
                        return commands.setMark('textStyle', {
                            fontSize: null,
                        });
                    },
            getLastFontLevel: () => () => {
                return this.storage.lastLevel || NORMAL_TEXT_LEVEL;
            },
        };
    },
});
