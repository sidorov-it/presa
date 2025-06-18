import tinycolor from 'tinycolor2';

// New color scheme data
const BLOCK_COLORS = {
    light: {
        gray: { hex: '#D6D6D6', name: 'Gray' },
        red: { hex: '#FFBDBD', name: 'Red' },
        orange: { hex: '#F8CB96', name: 'Orange' },
        yellow: { hex: '#FBEB8F', name: 'Yellow' },
        green: { hex: '#C9FDCB', name: 'Green' },
        blue: { hex: '#D1E5FD', name: 'Blue' },
        purple: { hex: '#D5CCFB', name: 'Purple' },
        primary: { hex: '#FFD300' },
        secondary: { hex: '#FF7979' },
        tertiary: { hex: '#A9FF8B' },
    },
    dark: {
        gray: { hex: '#999999', name: 'Gray' },
        red: { hex: '#EB5252', name: 'Red' },
        orange: { hex: '#DD8404', name: 'Orange' },
        yellow: { hex: '#CAAD07', name: 'Yellow' },
        green: { hex: '#50BD3D', name: 'Green' },
        blue: { hex: '#85BAFA', name: 'Blue' },
        purple: { hex: '#B1A0F8', name: 'Purple' },
        primary: { hex: '#856E01' },
        secondary: { hex: '#952222' },
        tertiary: { hex: '#257D04' },
    },
};

const ICON_COLORS = {
    light: {
        gray: { hex: '#7A7A7A', name: 'Gray' },
        red: { hex: '#EB0000', name: 'Red' },
        orange: { hex: '#BD6F00', name: 'Orange' },
        yellow: { hex: '#B29500', name: 'Yellow' },
        green: { hex: '#008545', name: 'Green' },
        blue: { hex: '#006ED6', name: 'Blue' },
        purple: { hex: '#7B57FF', name: 'Purple' },
    },
    dark: {
        gray: { hex: '#AFAFAF', name: 'Gray' },
        red: { hex: '#EF8784', name: 'Red' },
        orange: { hex: '#F5C274', name: 'Orange' },
        yellow: { hex: '#F5F380', name: 'Yellow' },
        green: { hex: '#8CE29F', name: 'Green' },
        blue: { hex: '#8DD4FB', name: 'Blue' },
        purple: { hex: '#A08CF8', name: 'Purple' },
    },
};

// Block type to color scheme mapping
const BLOCK_TYPE_TO_COLOR_SCHEME: Record<string, string> = {
    'note-box': 'gray',
    'info-box': 'blue',
    'warning-box': 'orange',
    'caution-box': 'red',
    'success-box': 'green',
    'question-box': 'purple',
};

/**
 * Устанавливает уровень светлоты (lightness) для заданного цвета.
 * Возвращает цвет в формате HEX с альфой (#RRGGBBAA).
 *
 * @param {string} color - Цвет в hex или любом формате, поддерживаемом tinycolor
 * @param {number} lightness - Значение lightness от 0 до 1
 * @returns {string} Цвет в формате #RRGGBBAA
 */
function setLightness(color: string, lightness: number): string {
    const hsl = tinycolor(color).toHsl();
    hsl.l = lightness;
    return tinycolor(hsl).toHex8String();
}

export interface GetBlockColorsOptions {
    blockBgColor?: string;
    iconColor?: string;
    textColor?: string;
    accentColor?: string;
}

export interface BlockColorsResult {
    blockBgColor: string;
    iconColor: string;
    textColor: string;
}

/**
 * Returns accessible block background, icon, and text colors for a given slide background and block type.
 * Uses the new color calculation logic with proper lightness adjustments.
 */
export const getBlockColors = (
    slideBgColor: string,
    blockType: string,
    options?: GetBlockColorsOptions
): BlockColorsResult => {
    const slideColor = tinycolor(slideBgColor);
    const isDarkTheme = slideColor.isDark();

    // Get color scheme from block type or use accent if accentColor is provided
    const colorScheme = options?.accentColor ? 'accent' : BLOCK_TYPE_TO_COLOR_SCHEME[blockType] || 'gray';
    const accentColor = options?.accentColor || '#FFD300'; // Default accent color

    // If custom colors are provided in options, use them directly
    if (options?.blockBgColor && options?.iconColor) {
        return {
            blockBgColor: options.blockBgColor,
            iconColor: options.iconColor,
            textColor: options.textColor || (isDarkTheme ? 'white' : 'black'),
        };
    }

    // 1. Calculate background color
    const baseBackgroundColor = (() => {
        if (colorScheme === 'accent') {
            return accentColor;
        }
        const colorKey = colorScheme as keyof typeof BLOCK_COLORS.light;
        return isDarkTheme ? BLOCK_COLORS.dark[colorKey]?.hex : BLOCK_COLORS.light[colorKey]?.hex;
    })();

    const backgroundColor = isDarkTheme
        ? setLightness(baseBackgroundColor, 0.15) // lighten for dark theme
        : setLightness(baseBackgroundColor, 0.85); // very light background for light theme

    // 2. Calculate icon color
    let iconColor: string;
    if (colorScheme === 'accent') {
        iconColor = isDarkTheme
            ? setLightness(accentColor, 0.7) // strongly lighten accent
            : setLightness(accentColor, 0.3); // slightly lighten accent
    } else {
        const colorKey = colorScheme as keyof typeof ICON_COLORS.light;
        iconColor = isDarkTheme ? ICON_COLORS.dark[colorKey]?.hex : ICON_COLORS.light[colorKey]?.hex;
    }

    // 3. Text color
    const textColor = isDarkTheme ? 'white' : 'black';

    return {
        blockBgColor: backgroundColor,
        iconColor: iconColor || '#7A7A7A', // fallback color
        textColor,
    };
};

/**
 * Generates a palette of chart colors based on slide background and accent color.
 * Colors are rotated around the accent hue and adjusted for contrast.
 */
export const getChartColors = (
    slideBgColor: string,
    accentColor: string,
    count = 5
): string[] => {
    const isDark = tinycolor(slideBgColor).isDark();
    const base = tinycolor(accentColor);
    const step = 360 / count;
    const result: string[] = [];

    for (let i = 0; i < count; i++) {
        let color = base.clone().spin(step * i);
        color = isDark ? color.lighten(10) : color.darken(10);
        result.push(color.toHexString());
    }

    return result;
};

/**
 * Calculates accessible colors for chart axes based on slide background and accent color.
 * Returns colors for axis lines and tick labels.
 */
export const getChartAxisColors = (
    slideBgColor: string,
    accentColor: string
): { axisLineColor: string; tickColor: string } => {
    const isDark = tinycolor(slideBgColor).isDark();
    const base = tinycolor(accentColor);

    const axisLineColor = isDark
        ? base.lighten(20).toHexString()
        : base.darken(20).toHexString();
    const tickColor = isDark
        ? base.lighten(40).toHexString()
        : base.darken(40).toHexString();

    return { axisLineColor, tickColor };
};
