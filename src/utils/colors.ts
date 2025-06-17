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
    // 1. Parse slide background color
    const slideColor = tinycolor(slideBgColor);
    const isSlideDark = slideColor.isDark();

    // 2. Get default block background color for blockType
    const blockDefaults = BLOCK_TYPE_DEFAULTS[blockType] || BLOCK_TYPE_DEFAULTS['note-box'];
    let blockBgColor =
        options?.blockBgColor || (isSlideDark ? blockDefaults.darkBlockBgColor : blockDefaults.blockBgColor);
    let blockColor = tinycolor(blockBgColor);

    if (!options?.blockBgColor) {
        // 3. Ensure block background color contrasts with slide background
        let contrast = tinycolor.readability(slideColor, blockColor);
        let attempts = 0;
        while (contrast < 3 && attempts < 5) {
            blockColor = isSlideDark ? blockColor.lighten(10) : blockColor.darken(10);
            contrast = tinycolor.readability(slideColor, blockColor);
            attempts++;
        }
    }
    blockBgColor = blockColor.toRgbString();

    // 4. Get icon color based on block background color
    let iconTiny = tinycolor(blockColor);
    const isBlockDark = blockColor.isDark();
    iconTiny = isBlockDark ? iconTiny.lighten(20) : iconTiny.darken(20);
    const iconColor = iconTiny.toRgbString();

    let textColor;
    const blackContrast = tinycolor.readability(blockBgColor, '#000');
    const whiteContrast = tinycolor.readability(blockBgColor, '#fff');
    textColor = blackContrast > whiteContrast ? '#000' : '#fff';
    // If neither black nor white is sufficient, try to adjust
    if (Math.max(blackContrast, whiteContrast) < 4.5) {
        // Try a slightly lighter or darker gray
        const altGray =
            blackContrast > whiteContrast
                ? tinycolor('#000').setAlpha(0.87).toRgbString()
                : tinycolor('#fff').setAlpha(0.87).toRgbString();
        const altContrast = tinycolor.readability(blockBgColor, altGray);
        if (altContrast > 4.5) {
            textColor = altGray;
        }
    }

    return { blockBgColor, iconColor, textColor };
};
