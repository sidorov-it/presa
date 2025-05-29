import { Theme } from '@/types/theme';

export const DEFAULT_THEME: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Default Theme',
    description: 'A clean, modern default theme',
    colors: {
        additionalColors: [],
        primaryAccent: '#3b82f6', // Blue
        shapesColor: '#00235cff',
        secondaryAccents: ['#60a5fa', '#93c5fd', '#bfdbfe'],
        headingColor: '#1f2937', // Dark gray
        textColor: '#4b5563', // Medium gray
        slideBackground: '#ffffff', // White
        pageBackground: {
            type: 'color',
            color: '#f3f4f6', // Light gray
            imageUrl: '',
        },
        accentBlocksColor: '#3b82f6',
        secondaryButtonColor: '#3f87fb',
    },
    typography: {
        headingFont: 'inter',
        headingWeight: 600,
        headingColor: '#1f2937', // Dark gray
        headingLineHeight: 1.25,
        headingLetterSpacing: 0,
        headingCapitalization: 'none',
        bodyFont: 'inter',
        bodyWeight: 400,
        bodyColor: '#4b5563', // Medium gray
        bodyLineHeight: 1.25,
        bodyLetterSpacing: 0,
        bodyCapitalization: 'none',
    },
    design: {
        slide: {
            borderRadius: '8px',
            shadow: 'sm',
            borderWidth: 'thin',
            borderColor: '#e5e7eb', // Light gray border
            imageShape: 'round',
            opacity: 0.8,
        },
        blocks: {
            backgroundColor: '#ffffff', // White
            backgroundBlockFillType: 'fill',
            borderWidth: 'thin',
            shadow: 'sm',
            blockFillColorsType: 'subtle',
            blockBackgroundCustomColors: [],
        },
        buttons: {
            buttonColor: '#3b82f6', // Blue
            buttonShape: 'rounded',
            linkColor: '#2563eb', // Darker blue
        },
    },
};

export const createNewTheme = (themeData: Partial<Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>> = {}): Theme => {
    return {
        id: crypto.randomUUID(), // Generate a valid UUID
        name: themeData.name || DEFAULT_THEME.name,
        description: themeData.description || DEFAULT_THEME.description,
        logo: themeData.logo,
        colors: {
            ...DEFAULT_THEME.colors,
            ...(themeData.colors || {}),
        },
        typography: {
            ...DEFAULT_THEME.typography,
            ...(themeData.typography || {}),
        },
        design: {
            slide: {
                ...DEFAULT_THEME.design.slide,
                ...(themeData.design?.slide || {}),
            },
            blocks: {
                ...DEFAULT_THEME.design.blocks,
                ...(themeData.design?.blocks || {}),
            },
            buttons: {
                ...DEFAULT_THEME.design.buttons,
                ...(themeData.design?.buttons || {}),
            },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};
