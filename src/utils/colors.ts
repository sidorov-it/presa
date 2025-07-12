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

    // If custom background color is provided, recalculate colors based on it
    if (options?.blockBgColor) {
        const customBgColor = tinycolor(options.blockBgColor);
        const isCustomBgDark = customBgColor.isDark();

        // Calculate text color based on background darkness
        const textColor = isCustomBgDark ? 'white' : 'black';

        // If icon color is provided, use it, otherwise generate based on background
        let iconColor: string;
        if (options.iconColor) {
            iconColor = options.iconColor;
        } else {
            // Get color scheme from block type
            const colorScheme = BLOCK_TYPE_TO_COLOR_SCHEME[blockType] || 'gray';
            const colorKey = colorScheme as keyof typeof ICON_COLORS.light;
            iconColor = isCustomBgDark ? ICON_COLORS.dark[colorKey]?.hex : ICON_COLORS.light[colorKey]?.hex;
        }

        return {
            blockBgColor: options.blockBgColor,
            iconColor: iconColor || '#7A7A7A', // fallback color
            textColor: options.textColor || textColor,
        };
    }

    // Get color scheme from block type or use accent if accentColor is provided
    const colorScheme = options?.accentColor ? 'accent' : BLOCK_TYPE_TO_COLOR_SCHEME[blockType] || 'gray';
    const accentColor = options?.accentColor || '#FFD300'; // Default accent color

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
 * Generates a palette of chart colors based on slide background and primary color.
 * Ensures each color is harmonious with the primary color and readable on the background.
 * Always returns unique, non-black, non-white colors.
 */
export const getChartColors = (slideBgColor: string, primaryColor: string, count = 5): string[] => {
    const bg = tinycolor(slideBgColor);
    const primary = tinycolor(primaryColor);
    const step = 360 / count;
    const palette: string[] = [];
    let attempts = 0;
    const maxAttempts = count * 12; // allow more attempts for uniqueness
    const MIN_HUE_DIFF = 30; // минимальная разница по hue

    // Helper to check contrast
    const isReadableStrict = (fg: string) => tinycolor.isReadable(fg, slideBgColor, { level: 'AA', size: 'small' });
    const isReadableLoose = (fg: string) => tinycolor.readability(fg, slideBgColor) > 2.5; // looser than AA
    const isBlackOrWhite = (color: string) => {
        const c = tinycolor(color);
        return (c.isDark() && c.getBrightness() < 10) || (c.isLight() && c.getBrightness() > 245);
    };
    const isDuplicate = (color: string) => palette.some(existing => tinycolor.equals(existing, color));
    const getHue = (color: string) => tinycolor(color).toHsl().h;
    const isHueTooClose = (color: string) =>
        palette.some(existing => {
            const h1 = getHue(existing);
            const h2 = getHue(color);
            const diff = Math.abs(h1 - h2);
            return Math.min(diff, 360 - diff) < MIN_HUE_DIFF;
        });

    for (let i = 0; palette.length < count && attempts < maxAttempts; i++, attempts++) {
        // Spin hue from primary, keep saturation and lightness
        const hue = (primary.toHsl().h + step * i) % 360;
        let color = tinycolor({
            h: hue,
            s: primary.toHsl().s,
            l: primary.toHsl().l,
        });
        // Blend slightly with background for harmony
        color = tinycolor.mix(color, bg, 15);
        // Try strict contrast, then loose, then adjust
        let tries = 0;
        let found = false;
        let candidate = color.clone();
        while (tries < 8 && !found) {
            const hex = candidate.toHexString();
            if (!isBlackOrWhite(hex) && !isDuplicate(hex) && !isHueTooClose(hex) && isReadableStrict(hex)) {
                palette.push(hex);
                found = true;
                break;
            }
            if (!isBlackOrWhite(hex) && !isDuplicate(hex) && !isHueTooClose(hex) && isReadableLoose(hex)) {
                palette.push(hex);
                found = true;
                break;
            }
            // Try adjusting lightness/saturation/hue
            candidate = candidate.isDark() ? candidate.lighten(12) : candidate.darken(12);
            if (tries % 2 === 1) candidate = candidate.saturate(10);
            if (tries % 3 === 2) candidate = candidate.spin(30);
            tries++;
        }
        // If not found, skip to next hue
    }
    // Fallback: if not enough, fill with default accessible colors (но не дублировать и не близко по hue)
    const fallbackColors = [
        '#3366CC',
        '#DC3912',
        '#FF9900',
        '#109618',
        '#990099',
        '#0099C6',
        '#DD4477',
        '#66AA00',
        '#B82E2E',
        '#316395',
    ];
    let fallbackIdx = 0;
    while (palette.length < count && fallbackIdx < fallbackColors.length) {
        const fallback = fallbackColors[fallbackIdx++];
        if (!isDuplicate(fallback) && !isBlackOrWhite(fallback) && !isHueTooClose(fallback)) palette.push(fallback);
    }
    // If still not enough, generate random unique colors (и не близко по hue)
    let randomTries = 0;
    while (palette.length < count && randomTries < 30) {
        const random = tinycolor.random().toHexString();
        if (!isDuplicate(random) && !isBlackOrWhite(random) && !isHueTooClose(random)) palette.push(random);
        randomTries++;
    }
    return palette.slice(0, count);
};

/**
 * Calculates accessible colors for chart axes based on slide background and accent color.
 * Returns colors for axis lines, tick labels and text.
 */
export const getChartAxisColors = (
    slideBgColor: string,
    accentColor: string
): { axisLineColor: string; tickColor: string; textColor: string } => {
    const isDark = tinycolor(slideBgColor).isDark();
    const base = tinycolor(accentColor);

    const axisLineColor = isDark ? base.lighten(20).toHexString() : base.darken(20).toHexString();
    const tickColor = isDark ? base.lighten(40).toHexString() : base.darken(40).toHexString();
    const textColor = isDark ? '#FFFFFF' : '#000000';

    return { axisLineColor, tickColor, textColor };
};
