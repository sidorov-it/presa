import { Theme } from '@/types/theme';

export const DEFAULT_THEME: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Minimal Light Theme',
    description: 'Clean light theme with blue accents',
    colors: {
        additionalColors: [],
        primaryAccent: '#3B82F6',
        shapesColor: '#3B82F6',
        secondaryAccents: ['#2563EB', '#60A5FA', '#93C5FD'],
        headingColor: '#111827',
        textColor: '#374151',
        slideBackground: '#FFFFFF',
        pageBackground: {
            type: 'color',
            color: '#F3F4F6',
            imageUrl: '',
        },
        accentBlocksColor: '#3B82F6',
        secondaryButtonColor: '#2563EB',
    },
    typography: {
        headingFont: 'inter',
        headingWeight: 600,
        headingColor: '#111827',
        headingLineHeight: 1.25,
        headingLetterSpacing: 0,
        headingCapitalization: 'none',
        bodyFont: 'inter',
        bodyWeight: 400,
        bodyColor: '#374151',
        bodyLineHeight: 1.25,
        bodyLetterSpacing: 0,
        bodyCapitalization: 'none',
    },
    design: {
        slide: {
            borderRadius: '8px',
            shadow: 'sm',
            borderWidth: 'thin',
            borderColor: '#E5E7EB',
            imageShape: 'round',
            opacity: 1,
        },
        blocks: {
            backgroundColor: '#FFFFFF',
            backgroundBlockFillType: 'fill',
            borderWidth: 'thin',
            shadow: 'sm',
            blockFillColorsType: 'subtle',
            blockBackgroundCustomColors: [],
        },
        buttons: {
            buttonColor: '#3B82F6',
            buttonShape: 'rounded',
            linkColor: '#3B82F6',
        },
    },
};

export const createNewTheme = (
    themeData: Partial<Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>> = {}
): Theme => {
    return {
        // id: new Prisma.ObjectId().toString(),// Generate a valid UUID
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
        isDefault: themeData.isDefault ?? false,
        isActive: themeData.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};
