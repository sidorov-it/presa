/* eslint-disable no-inner-declarations */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/**
 * Clears all theme-related CSS variables from document.documentElement
 * Use this when you want to completely remove theme styling from the page
 */
export const clearAllThemeStyles = (): void => {


    // List of all presentation-related CSS variables that might be set
    const presentationVars = [
        '--presentation-primary-accent',
        '--presentation-secondary-accent-1',
        '--presentation-secondary-accent-2',
        '--presentation-secondary-accent-3',
        // '--presentation-shapes-color',
        '--presentation-accent-blocks-color',
        '--presentation-accent-blocks-text-color',
        // '--presentation-secondary-button-color',
        '--presentation-heading-color',
        '--presentation-text-color',
        '--presentation-slide-background',
        '--presentation-page-background-color',
        '--presentation-page-background-image',
        '--presentation-page-background-size',
        '--presentation-page-background-position',
        '--presentation-page-background-repeat',
        '--presentation-page-background-attachment',
        '--presentation-heading-font',
        '--presentation-heading-weight',
        '--presentation-body-font',
        '--presentation-body-weight',
        '--presentation-heading-line-height',
        '--presentation-heading-letter-spacing',
        '--presentation-heading-capitalization',
        '--presentation-body-line-height',
        '--presentation-body-letter-spacing',
        '--presentation-body-capitalization',
        '--presentation-slide-border-radius',
        '--presentation-slide-shadow',
        '--presentation-slide-border-width',
        '--presentation-slide-border-color',
        '--presentation-slide-image-mask-image-left',
        '--presentation-slide-image-mask-image-right',
        '--presentation-slide-image-mask-image-top',
        '--presentation-block-fill-type',
        '--presentation-block-border-width',
        '--presentation-block-background',
        '--presentation-block-background-custom-type',
        '--presentation-block-background-custom-1',
        '--presentation-block-background-custom-2',
        '--presentation-block-background-custom-3',
        '--presentation-block-background-custom-count',
        '--presentation-block-shadow',
        '--presentation-button-color',
        '--presentation-button-hover-color',
        '--presentation-button-text-color',
        '--presentation-button-radius',
        '--presentation-link-color',
    ];

    // Remove all presentation variables from document.documentElement
    presentationVars.forEach(varName => {
        document.documentElement.style.removeProperty(varName);
    });

    // Clear body background styles that might be set by themes
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundAttachment = '';
    document.body.style.backgroundColor = '';
};

export function getContrastingTextColor(hexColor: string): '#000000' | '#FFFFFF' {
    // Удаляем символ "#" если есть
    const hex = hexColor.replace('#', '');

    // Проверка на валидность
    if (!/^([0-9A-Fa-f]{6,8})$/.test(hex)) {
        throw new Error(`Invalid hex color format: ${hexColor}`);
    }

    // Преобразуем hex в R, G, B
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Вычисляем яркость по формуле для восприятия
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    // Порог для определения черного или белого текста
    return luminance > 166 ? '#000000' : '#FFFFFF';
}

/**
 * Возвращает подходящий цвет границы на основе цвета фона
 * Для светлых фонов возвращает более темную границу
 * Для темных фонов возвращает более светлую границу
 */
export function getBorderColorForBackground(hexColor: string): string {
    // Удаляем символ "#" если есть
    const hex = hexColor.replace('#', '');

    // Проверка на валидность
    if (!/^([0-9A-Fa-f]{6,8})$/.test(hex)) {
        throw new Error(`Invalid hex color format: ${hexColor}`);
    }

    // Преобразуем hex в R, G, B
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Вычисляем яркость по формуле для восприятия
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    // Определяем, светлый это цвет или темный
    const isLight = luminance > 128;

    let newR: number, newG: number, newB: number;

    if (isLight) {
        // Для светлых цветов делаем границу темнее на 20-30%
        const darkenFactor = 0.25;
        newR = Math.max(0, Math.round(r * (1 - darkenFactor)));
        newG = Math.max(0, Math.round(g * (1 - darkenFactor)));
        newB = Math.max(0, Math.round(b * (1 - darkenFactor)));
    } else {
        // Для темных цветов делаем границу светлее на 30-40%
        const lightenFactor = 0.35;
        newR = Math.min(255, Math.round(r + (255 - r) * lightenFactor));
        newG = Math.min(255, Math.round(g + (255 - g) * lightenFactor));
        newB = Math.min(255, Math.round(b + (255 - b) * lightenFactor));
    }

    // Преобразуем обратно в hex
    const toHex = (value: number) => value.toString(16).padStart(2, '0');
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Возвращает "subtle" вариант цвета фона для блоков с текстом
 * Создает слегка затемненную или осветленную версию цвета фона с прозрачностью
 * для визуального выделения блоков на этом же фоне
 *
 * @param backgroundHex - цвет фона (например, "#FFFFFF")
 * @param opacity - прозрачность результирующего цвета (по умолчанию 0.08)
 * @returns строка в формате rgba()
 */
// export function getSubtleColor(backgroundHex: string, opacity: number = 0.08): string {
//     // Удаляем символ "#" если есть
//     const hex = backgroundHex.replace('#', '');

//     // Проверка на валидность цвета
//     if (!/^([0-9A-Fa-f]{6})$/.test(hex)) {
//         throw new Error(`Invalid hex color format: ${backgroundHex}`);
//     }

//     // Проверка opacity
//     if (opacity < 0 || opacity > 1) {
//         throw new Error(`Opacity must be between 0 and 1, got: ${opacity}`);
//     }

//     // Преобразуем hex в R, G, B
//     const r = parseInt(hex.substring(0, 2), 16);
//     const g = parseInt(hex.substring(2, 4), 16);
//     const b = parseInt(hex.substring(4, 6), 16);

//     // Вычисляем яркость фона
//     const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
//     const isLightBackground = luminance > 128;

//     let finalR: number, finalG: number, finalB: number;

//     if (isLightBackground) {
//         // Для светлого фона создаем слегка затемненную версию
//         const darkenFactor = 0.15;
//         finalR = Math.max(0, Math.round(r * (1 - darkenFactor)));
//         finalG = Math.max(0, Math.round(g * (1 - darkenFactor)));
//         finalB = Math.max(0, Math.round(b * (1 - darkenFactor)));
//     } else {
//         // Для темного фона создаем слегка осветленную версию
//         const lightenFactor = 0.15;
//         finalR = Math.min(255, Math.round(r + (255 - r) * lightenFactor));
//         finalG = Math.min(255, Math.round(g + (255 - g) * lightenFactor));
//         finalB = Math.min(255, Math.round(b + (255 - b) * lightenFactor));
//     }

//     return `rgba(${finalR}, ${finalG}, ${finalB}, ${opacity})`;
// }

function hexToRgb(hex: string): [number, number, number] {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3)
        hex = hex
            .split('')
            .map(x => x + x)
            .join('');
    if (hex.length !== 6) throw new Error('Invalid HEX');
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// https://stackoverflow.com/a/9493060/1132305
function rgbToHsl([rIn, gIn, bIn]: [number, number, number]): [number, number, number] {
    const r: number = rIn / 255;
    const g: number = gIn / 255;
    const b: number = bIn / 255;
    const max: number = Math.max(r, g, b);
    const min: number = Math.min(r, g, b);
    let h: number = 0;
    let s: number = 0;
    const l: number = (max + min) / 2;
    if (max === min) {
        h = 0;
        s = 0;
    } else {
        const d: number = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return [h * 360, s, l];
}

function hslToRgb([hIn, s, l]: [number, number, number]): [number, number, number] {
    let r: number, g: number, b: number;
    const h: number = hIn / 360;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number): number => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q: number = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p: number = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
    return '#' + [r, g, b].map((x: number) => x.toString(16).padStart(2, '0')).join('');
}

export function getSubtleColor(hex: string): string {
    const rgb: [number, number, number] = hexToRgb(hex);
    const [h, s, l]: [number, number, number] = rgbToHsl(rgb);
    // попробуем сильнее снизить насыщенность и осветлить
    const newS: number = s * 0.5; // снизим насыщенность в 2 раза
    const newL: number = l * 0.9 + 0.05; // сделаем цвет светлее
    const subtleRgb: [number, number, number] = hslToRgb([h, newS, newL]);
    return rgbToHex(subtleRgb) + 'ff';
}

export type SlideLayoutParams = {
    aspectRatio: number;
    themeFontSize?: number; // theme.config.fontSize
    cardFontScale?: number; // по умолчанию 1
    renderMode?: 'view' | 'edit'; // по умолчанию 'edit'
    zoomLevel?: number; // по умолчанию 1
    containerWidth?: number; // Ширина контейнера в пикселях
    containerHeight?: number; // Высота контейнера в пикселях
    useContainerScaling?: boolean; // Использовать масштабирование относительно контейнера
};

export const calculateLayoutMetrics = ({ themeFontSize = 1 }: { themeFontSize?: number }) => {
    const fontSizeRem = 0.875; // "sm" всегда
    const baseFontSize = themeFontSize * fontSizeRem;

    const contentWidthScale = 115; // defaultContentWidth = "lg"
    const contentWidthEms = (contentWidthScale * (16 / themeFontSize)) / fontSizeRem;

    // Паддинги (на глаз, без isMobile и nestedDepth)
    const horizontalPaddingEms = 1.5 * fontSizeRem * 2;

    const cardWidthEms = contentWidthEms + horizontalPaddingEms;

    return {
        baseFontSize,
        contentWidthEms,
        cardWidthEms,
    };
};

// export const getSlideLayoutVars = ({
//     aspectRatio,
//     // themeFontSize = 18,
//     cardFontScale = 1,
//     renderMode = 'edit',
//     // zoomLevel = 1,
// }: SlideLayoutParams) => {
//     // const { baseFontSize, contentWidthEms, cardWidthEms } = calculateLayoutMetrics({ themeFontSize });

//     const zoomLevel = calculateSlideWidthRatio(renderMode);

//     const cardMaxWidth = 'calc(var(--editor-width) - 2 * var(--card-outer-padding-x))';
//     const cardMaxHeight = `calc(100vh - 2 * var(--card-outer-padding-y))`;

//     // const cardWidthCSS = `min(${cardMaxWidth}, calc(${cardMaxHeight} * ${aspectRatio}))`;
//     const cardWidthCSS = `min(var(--card-max-width), calc(var(--card-max-height)* ${aspectRatio}))`;
//     // const cardMinHeight = `calc(${cardWidthCSS} / ${aspectRatio})`;
//     const cardMinHeight = `calc(min(var(--card-max-width), calc(var(--card-max-height)* ${aspectRatio})) / ${aspectRatio})`;

//     const preparedZoomLevel = renderMode === 'view' ? zoomLevel : Math.min(1, zoomLevel);
//     const fontSize = `calc(0.875 * var(--card-font-scale, 1) * var(--editor-font-size, 1rem) * ${preparedZoomLevel} * var(--viewport-scale-factor, 1.125))`;

//     return {
//         '--editor-width': '100vw',
//         // '--zoom-level': '1',
//         '--card-width': cardWidthCSS,
//         '--card-font-scale': `${cardFontScale}`,
//         '--font-size': fontSize,
//         '--card-max-width': cardMaxWidth,
//         '--card-max-height': cardMaxHeight,
//         '--card-min-height': cardMinHeight,
//         // '--media-scale': 'min(1, var(--card-font-scale, 1))',

//         '--card-inner-padding-x': 'calc(4em / var(--card-font-scale, 1))',
//         '--card-inner-padding-y': 'calc(2.75em / var(--card-font-scale, 1))',
//         '--card-margin-height': 'calc(2.75em / var(--card-font-scale, 1))',
//         '--card-inner-padding': 'var(--card-inner-padding-y) var(--card-inner-padding-x)',
//         '--card-outer-padding-left':
//             'calc(var(--card-outer-padding-x) + var(--doc-padding-left, 0px) + var(--present-padding-left, 0px))',
//         '--card-outer-padding-right':
//             'calc(var(--card-outer-padding-x) + var(--doc-padding-right, 0px) + var(--present-padding-right, 0px))',
//         '--card-outer-padding-x': '0px',
//         '--card-outer-padding-y': '0px',
//         '--comment-padding': '4em',
//         '--nested-card-margin': 'calc(-1* var(--comment-padding))',
//         '--top-accent-height-sm': '6.25em',
//         '--top-accent-height-md': '12.5em',
//         '--top-accent-height-lg': '18.75em',
//         '--top-accent-height': 'var(--top-accent-height-md)',
//         '--behind-accent-height': '24em',
//         '--viewport-scale-factor': '1.125',
//         // '--card-width': 'min(var(--card-max-width), calc(var(--card-max-height)* 1.7777777777777777))',
//         // '--card-font-scale': '1',
//         // '--font-size': 'calc(var(--zoom-level)* var(--card-font-scale, 1)* min(var(--card-max-width), calc(var(--card-max-height)* 1.7777777777777777)) / 73.71428571428571)',
//         // '--card-max-width': 'calc(var(--editor-width) - 2* var(--card-outer-padding-x))',
//         // '--card-max-height': 'calc(100vh - 2* var(--card-outer-padding-y))',
//         // '--card-min-height': 'calc(min(var(--card-max-width), calc(var(--card-max-height)* 1.7777777777777777)) / 1.7777777777777777)',
//         '--media-scale': 'min(1, var(--card-font-scale, 1))',
//         '--zoom-level': zoomLevel,
//         '--card-vertical-align': 'center',
//     };
// };

export const calculateSlideWidthRatio = (renderMode: 'view' | 'edit'): number => {
    if (renderMode === 'view') {
        // Максимальная ширина слайда в режиме просмотра. либо 100vw, либо 100vh * 1.7777777777777777 для сохранения пропорций
        const maxSlideWidthPx = Math.min(window.innerHeight * 1.7777777777777777, window.innerWidth);

        // будем считать коэффициент, на сколько слайд больше, чем в конструкторе
        const MAX_SLIDE_WIDTH_EM = 64.5;
        // Получаем текущий размер шрифта для расчета em в пикселях
        const currentFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        // Максимальная ширина слайда в конструкторе
        const defaultSlideWidthPx = MAX_SLIDE_WIDTH_EM * currentFontSize;
        // Рассчитываем соотношение между максимальной шириной слайда в конструкторе и текущей шириной слайда
        const ratio = maxSlideWidthPx / defaultSlideWidthPx;
        return ratio;
    } else {
        // Максимальная ширина слайда в редакторе 64.4em
        const MAX_SLIDE_WIDTH_EM = 64.5;
        // Получаем текущий размер шрифта для расчета em в пикселях
        const currentFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const maxSlideWidthPx = MAX_SLIDE_WIDTH_EM * currentFontSize;
        // Получаем доступную ширину экрана
        const availableWidth = document.body.clientWidth;
        // Вычитаем отступы редактора (из CSS файла Editor.module.css)
        // по 3em с 2 сторон
        const totalPadding = 3 * currentFontSize * 2;
        const actualAvailableWidth = availableWidth - totalPadding;
        // Рассчитываем соотношение между доступной шириной и максимальной шириной слайда
        // используется только при окне, размер которого меньше 64.5em для рассчета, на сколько уменьшить шрифт
        // если окно больше 64.5em, то используется коэффициент 1
        const ratio = actualAvailableWidth / maxSlideWidthPx;
        return ratio;
    }
};

export const calculateContainerBasedZoomLevel = (
    containerWidth: number,
    containerHeight: number,
    aspectRatio: number = 1.7777777777777777
): number => {
    // Стандартная ширина слайда в редакторе
    const MAX_SLIDE_WIDTH_EM = 64.5;
    const currentFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const defaultSlideWidthPx = MAX_SLIDE_WIDTH_EM * currentFontSize;

    // Рассчитываем максимальную ширину слайда, которая поместится в контейнер
    const maxSlideWidthPx = Math.min(containerWidth, containerHeight * aspectRatio);

    // Рассчитываем соотношение
    const ratio = maxSlideWidthPx / defaultSlideWidthPx;
    return Math.min(1, ratio); // Не увеличиваем больше стандартного размера
};

export const getSlideLayoutVars = ({
    aspectRatio,
    cardFontScale = 1,
    renderMode = 'edit',
    containerWidth,
    containerHeight,
    useContainerScaling = false,
}: SlideLayoutParams) => {
    let zoomLevel: number;

    if (useContainerScaling && containerWidth && containerHeight) {
        // Используем масштабирование относительно контейнера
        zoomLevel = calculateContainerBasedZoomLevel(containerWidth, containerHeight, aspectRatio);
    } else {
        // Используем стандартное масштабирование относительно viewport
        zoomLevel = calculateSlideWidthRatio(renderMode);
    }

    const cardMaxWidth = 'calc(var(--editor-width) - 2 * var(--card-outer-padding-x))';
    const cardMaxHeight = `calc(100vh - 2 * var(--card-outer-padding-y))`;

    const cardWidthCSS = `min(var(--card-max-width), calc(var(--card-max-height)* ${aspectRatio}))`;
    const cardMinHeight = `calc(min(var(--card-max-width), calc(var(--card-max-height)* ${aspectRatio})) / ${aspectRatio})`;

    const preparedZoomLevel = renderMode === 'view' ? zoomLevel : Math.min(1, zoomLevel);
    const fontSize = `calc(1 * var(--card-font-scale, 1) * var(--editor-font-size, 1rem) * ${preparedZoomLevel} * var(--viewport-scale-factor, 1.125))`;

    return {
        '--editor-width': useContainerScaling ? `${containerWidth}px` : '100vw',
        '--card-width': cardWidthCSS,
        '--card-font-scale': `${cardFontScale}`,
        '--font-size': fontSize,
        '--card-max-width': cardMaxWidth,
        '--card-max-height': cardMaxHeight,
        '--card-min-height': cardMinHeight,
        '--card-inner-padding-y': 'calc(3.5em / var(--card-font-scale, 1))',
        '--card-inner-padding-x': 'calc(2.75em / var(--card-font-scale, 1))',
        '--card-margin-height': 'calc(2.75em / var(--card-font-scale, 1))',
        '--card-inner-padding': 'var(--card-inner-padding-y) var(--card-inner-padding-x)',
        '--card-outer-padding-left':
            'calc(var(--card-outer-padding-x) + var(--doc-padding-left, 0px) + var(--present-padding-left, 0px))',
        '--card-outer-padding-right':
            'calc(var(--card-outer-padding-x) + var(--doc-padding-right, 0px) + var(--present-padding-right, 0px))',
        '--card-outer-padding-x': '0px',
        '--card-outer-padding-y': '0px',
        '--comment-padding': '4em',
        '--nested-card-margin': 'calc(-1* var(--comment-padding))',
        '--top-accent-height-sm': '6.25em',
        '--top-accent-height-md': '12.5em',
        '--top-accent-height-lg': '18.75em',
        '--top-accent-height': 'var(--top-accent-height-md)',
        '--behind-accent-height': '24em',
        '--viewport-scale-factor': '1.125',
        '--media-scale': 'min(1, var(--card-font-scale, 1))',
        '--zoom-level': zoomLevel,
        '--card-vertical-align': 'center',
    };
};
