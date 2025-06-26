import {
    Theme,
    ThemeData,
    ThemeDesignBackgroundBlockFillType,
    ThemeDesignImageShape,
    ThemeDesignShadow,
} from '../types/theme';
import createNewTheme from '@/utils/theme/createNewTheme';

interface BasicThemeSettings {
    primaryAccent: string;
    headingColor: string;
    bodyColor: string;
    cardColor: string;
    pageBackground: string;
    roundness: string;
    shadow: string;
    cardBorder: string;
    cardBorderColor: string;
    cardTransparency: number;
    imageShape: string;
    blockFillType: string;
    blockFill: string;
    blockBorder: string;
    blockShadow: string;
}

export const convertBasicThemeToFull = (basicTheme: BasicThemeSettings, name = 'Custom Theme'): Omit<Theme, 'id'> => {
    const base = createNewTheme();

    // Map shadow values
    const shadowMap: Record<string, ThemeDesignShadow> = {
        none: 'none',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
    };

    // Map border values
    const borderMap: Record<string, 'none' | 'thin' | 'medium' | 'thick'> = {
        none: 'none',
        thin: 'thin',
        medium: 'medium',
        thick: 'thick',
    };

    const themeData: ThemeData = {
        name,
        description: 'Custom theme created from basic settings',
        colors: {
            primaryAccent: basicTheme.primaryAccent,
            primaryAccentTextColor: '#FFFFFF', // Default to white text on accent color
            slideBackground: basicTheme.cardColor,
            pageBackground: {
                type: 'color',
                color: basicTheme.pageBackground,
                imageUrl: '',
            },
        },
        typography: {
            headingColor: basicTheme.headingColor,
            bodyColor: basicTheme.bodyColor,
            headingFont: 'inter', // Default font
            bodyFont: 'inter', // Default font
            headingWeight: 400,
            headingLineHeight: 1.25,
            headingLetterSpacing: 0,
            headingCapitalization: 'none',
            bodyWeight: 400,
            bodyLineHeight: 1.25,
            bodyLetterSpacing: 0,
            bodyCapitalization: 'none',
        },
        design: {
            slide: {
                borderRadius: basicTheme.roundness || '4px',
                borderColor: basicTheme.cardBorderColor || '',
                shadow: shadowMap[basicTheme.shadow] || 'none',
                borderWidth: borderMap[basicTheme.cardBorder] || 'none',
                imageShape: (basicTheme.imageShape as ThemeDesignImageShape) || 'default',
                opacity: basicTheme.cardTransparency || 1,
            },
            blocks: {
                backgroundColor: basicTheme.primaryAccent,
                backgroundBlockFillType: basicTheme.blockFill as ThemeDesignBackgroundBlockFillType,
                borderWidth: borderMap[basicTheme.blockBorder] || 'none',
                shadow: shadowMap[basicTheme.blockShadow] || 'none',
                blockFillColorsType: basicTheme.blockFillType as 'primary' | 'subtle' | 'custom',
                blockBackgroundCustomColors: [],
            },
            buttons: {
                buttonColor: basicTheme.primaryAccent,
                buttonShape: 'default',
                linkColor: basicTheme.primaryAccent,
            },
        },
    };

    return {
        ...base,
        ...themeData,
        colors: {
            ...base.colors,
            ...themeData.colors,
        },
        typography: {
            ...base.typography,
            ...themeData.typography,
        },
        design: {
            slide: {
                ...base.design.slide,
                ...themeData.design.slide,
            },
            blocks: {
                ...base.design.blocks,
                ...themeData.design.blocks,
            },
            buttons: {
                ...base.design.buttons,
                ...themeData.design.buttons,
            },
        },
    };
};
