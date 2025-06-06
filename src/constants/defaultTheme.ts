import { Theme } from '@/types/theme';

export const DEFAULT_THEME: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Modern Dark Theme',
    description: 'A sleek, modern dark theme with vibrant accents',
    colors: {
        additionalColors: [],
        primaryAccent: '#007BFF', // Electric Blue
        shapesColor: '#007BFF', // Electric Blue
        secondaryAccents: ['#6C63FF', '#00FFFF', '#A0A0A0'], // Indigo Purple, Neon Cyan, Steel Gray
        headingColor: '#F5F5F5', // Cool White
        textColor: '#A0A0A0', // Steel Gray
        slideBackground: '#1E1E1E', // Charcoal Gray
        pageBackground: {
            type: 'color',
            color: '#0B0B0B', // Jet Black
            imageUrl: '',
        },
        accentBlocksColor: '#007BFF', // Electric Blue
        secondaryButtonColor: '#6C63FF', // Indigo Purple
    },
    typography: {
        headingFont: 'inter',
        headingWeight: 600,
        headingColor: '#F5F5F5', // Cool White
        headingLineHeight: 1.25,
        headingLetterSpacing: 0,
        headingCapitalization: 'none',
        bodyFont: 'inter',
        bodyWeight: 400,
        bodyColor: '#A0A0A0', // Steel Gray
        bodyLineHeight: 1.25,
        bodyLetterSpacing: 0,
        bodyCapitalization: 'none',
    },
    design: {
        slide: {
            borderRadius: '8px',
            shadow: 'sm',
            borderWidth: 'thin',
            borderColor: '#3A3F4B', // Slate Gray
            imageShape: 'round',
            opacity: 0.8,
        },
        blocks: {
            backgroundColor: '#1E1E1E', // Charcoal Gray
            backgroundBlockFillType: 'fill',
            borderWidth: 'thin',
            shadow: 'sm',
            blockFillColorsType: 'subtle',
            blockBackgroundCustomColors: [],
        },
        buttons: {
            buttonColor: '#007BFF', // Electric Blue
            buttonShape: 'rounded',
            linkColor: '#007BFF', // Electric Blue
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
