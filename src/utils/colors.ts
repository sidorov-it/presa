import tinycolor from 'tinycolor2';

// Block type to default background color mapping (from menuRegistry)
const BLOCK_TYPE_DEFAULTS: Record<
    string,
    { blockBgColor: string; darkBlockBgColor: string; defaultIconColor: string }
> = {
    'note-box': {
        blockBgColor: '#bbb8fa',
        darkBlockBgColor: '#01004d',
        defaultIconColor: '#3f3f5a',
    },
    'info-box': {
        blockBgColor: '#b6d6fc',
        darkBlockBgColor: '#032349',
        defaultIconColor: '#006ed6',
    },
    'warning-box': {
        blockBgColor: '#ffb3b3',
        darkBlockBgColor: '#450808',
        defaultIconColor: '#b29500',
    },
    'caution-box': {
        blockBgColor: '#ffb3b3',
        darkBlockBgColor: '#4a3f03',
        defaultIconColor: '#eb0000',
    },
    'success-box': {
        blockBgColor: '#b5fcb8',
        darkBlockBgColor: '#183a13',
        defaultIconColor: '#0c3f8d',
    },
    'question-box': {
        blockBgColor: '#b5fcb8',
        darkBlockBgColor: '#262626',
        defaultIconColor: '#7a7a7a',
    },
};

export interface GetBlockColorsOptions {
    blockBgColor?: string;
    iconColor?: string;
    textColor?: string;
}

export interface BlockColorsResult {
    blockBgColor: string;
    iconColor: string;
    textColor: string;
}

/**
 * Returns accessible block background, icon, and text colors for a given slide background and block type.
 * Ensures sufficient contrast and visual harmony.
 */
export const getBlockColors = (
    slideBgColor: string,
    blockType: string,
    options?: GetBlockColorsOptions
): BlockColorsResult => {
    const slideColor = tinycolor(slideBgColor);
    const isSlideDark = slideColor.isDark();

    const blockDefaults = BLOCK_TYPE_DEFAULTS[blockType] || BLOCK_TYPE_DEFAULTS['note-box'];
    const baseBlockColorHex = options?.blockBgColor || (isSlideDark ? blockDefaults.darkBlockBgColor : blockDefaults.blockBgColor);
    let blockColor = tinycolor(baseBlockColorHex);

    // Подстройка цвета блока под фон слайда
    if (!options?.blockBgColor) {
        blockColor = isSlideDark ? blockColor.lighten(20) : blockColor.darken(10);
    }

    let blockBgColor = blockColor.toRgbString();

    // Цвет текста (черный или белый в зависимости от контраста)
    let textColor: string;
    const blackContrast = tinycolor.readability(blockBgColor, '#000');
    const whiteContrast = tinycolor.readability(blockBgColor, '#fff');
    textColor = blackContrast > whiteContrast ? '#000' : '#fff';

    // Цвет иконки: та же гамма, но контрастная яркость
    let iconColor: string;

    if (options?.iconColor) {
        iconColor = options.iconColor;
    } else {
        const isBlockDark = blockColor.isDark();
        let iconColorObj = tinycolor(blockColor);

        // Осветляем или затемняем ту же гамму для иконки
        iconColorObj = isBlockDark ? iconColorObj.lighten(35) : iconColorObj.darken(35);

        // Гарантируем читаемость
        let contrast = tinycolor.readability(blockBgColor, iconColorObj);
        let attempts = 0;
        while (contrast < 4 && attempts < 5) {
            iconColorObj = isBlockDark ? iconColorObj.lighten(5) : iconColorObj.darken(5);
            contrast = tinycolor.readability(blockBgColor, iconColorObj);
            attempts++;
        }

        iconColor = iconColorObj.toRgbString();
    }

    return {
        blockBgColor,
        iconColor,
        textColor,
    };
};
