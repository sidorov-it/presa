import { Theme, ThemeData } from '@/types/theme';

export const DEFAULT_THEME: ThemeData = {
    name: 'Modern Dark Theme',
    description: 'A sleek, modern dark theme with vibrant accents',
    colors: {
        primaryAccent: '#2B0AFF',
        slideBackground: '#FFFFFF',
        pageBackground: {
            type: 'color',
            color: '#FFFFFF', // Jet Black
            imageUrl: '',
        },
    },
    typography: {
        headingFont: 'inter',
        headingWeight: 600,
        headingColor: '#000000',
        headingLineHeight: 1.25,
        headingLetterSpacing: 0,
        headingCapitalization: 'none',
        bodyFont: 'inter',
        bodyWeight: 400,
        bodyColor: '#272525',
        bodyLineHeight: 1.25,
        bodyLetterSpacing: 0,
        bodyCapitalization: 'none',
    },
    design: {
        slide: {
            borderRadius: '8px',
            shadow: 'sm',
            borderWidth: 'thin',
            borderColor: '#3A3F4B',
            opacity: 0.8,
            imageShape: 'default',
        },
        blocks: {
            backgroundColor: '#1E1E1E',
            backgroundBlockFillType: 'fill',
            borderWidth: 'thin',
            shadow: 'none',
            blockFillColorsType: 'primary',
            blockBackgroundCustomColors: [],
        },
        buttons: {
            buttonColor: '',
            buttonShape: 'default',
            linkColor: '',
        },
    },
};

export const createNewTheme = (): Omit<Theme, 'id'> => {
    return {
        name: '',
        description: '',
        // logo: themeData.logo,
        colors: {
            ...DEFAULT_THEME.colors,
            // ...(themeData.colors || {}),
        },
        typography: {
            ...DEFAULT_THEME.typography,
            // ...(themeData.typography || {}),
        },
        design: {
            slide: {
                ...DEFAULT_THEME.design.slide,
                // ...(themeData.design?.slide || {}),
            },
            blocks: {
                ...DEFAULT_THEME.design.blocks,
                // ...(themeData.design?.blocks || {}),
            },
            buttons: {
                ...DEFAULT_THEME.design.buttons,
                // ...(themeData.design?.buttons || {}),
            },
        },
        isDefault: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};
