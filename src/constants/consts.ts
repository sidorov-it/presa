export const SMALL_TEXT_LEVEL = 8;
export const NORMAL_TEXT_LEVEL = 7;
export const BIG_TEXT_LEVEL = 6;
export const HEADING_5_LEVEL = 5;
export const HEADING_4_LEVEL = 4;
export const HEADING_3_LEVEL = 3;
export const HEADING_2_LEVEL = 2;
export const HEADING_1_LEVEL = 1;
export const TITLE_LEVEL = 0;
export const BIG_HEADING_LEVEL = -1;
export const VERY_BIG_HEADING_LEVEL = -2;

export const FONT_SIZE_SMALL_TEXT = '0.8em';
export const FONT_SIZE_BIG_TEXT = '1.25em';
export const FONT_SIZE_HEADING_4 = '1.25em';
export const FONT_SIZE_HEADING_3 = '1.5em';
export const FONT_SIZE_HEADING_2 = '2em';
export const FONT_SIZE_HEADING_1 = '2.5em';
export const FONT_SIZE_TITLE = '3.45em';
export const FONT_SIZE_BIG_HEADING = '5em';
export const FONT_SIZE_VERY_BIG_HEADING = '7.5em';

export const FONT_WEIGHTS = [
    {
        label: 'Thin',
        value: 100,
    },
    {
        label: 'Extra Light',
        value: 200,
    },
    {
        label: 'Light',
        value: 300,
    },
    {
        label: 'Regular',
        value: 400,
    },
    {
        label: 'Medium',
        value: 500,
    },
    {
        label: 'Semi Bold',
        value: 600,
    },
    {
        label: 'Bold',
        value: 700,
    },
];

export const HEADING_LEVELS = [
    { label: 'Маленький текст', level: SMALL_TEXT_LEVEL },
    { label: 'Нормальный текст', level: NORMAL_TEXT_LEVEL },
    { label: 'Большой текст', level: BIG_TEXT_LEVEL },
    // { label: 'h4', level: HEADING_4_LEVEL },
    { label: 'h3', level: HEADING_3_LEVEL },
    { label: 'h2', level: HEADING_2_LEVEL },
    { label: 'h1', level: HEADING_1_LEVEL },
    { label: 'Заголовок', level: TITLE_LEVEL },
    { label: 'Большой заголовок', level: BIG_HEADING_LEVEL },
    { label: 'Очень большой заголовок', level: VERY_BIG_HEADING_LEVEL },
];

export const THEME_CONSTANTS = {
    SHADOWS: {
        NONE: 'none',
        SM: '0 10px 15px -3px {borderColor},0 4px 6px -2px {borderColor}',
        MD: '8px 8px 0px 0px {borderColor}',
    },
};
