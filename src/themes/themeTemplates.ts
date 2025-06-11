import { Theme } from '@/types/theme';
import { createNewTheme } from '@/constants/defaultTheme';

const createTheme = (
    id: string,
    data: Partial<Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>>
): Theme => {
    const theme = createNewTheme(data);
    theme.id = id;
    return theme;
};

export const THEME_TEMPLATES: Theme[] = [
    createTheme('atacama', {
        name: 'Atacama Desert',
        description: 'Warm desert tones with earthy colors',
        colors: {
            primaryAccent: '#E65100',
            shapesColor: '#E65100',
            secondaryAccents: ['#FB8C00', '#FFB74D', '#8D6E63'],
            headingColor: '#4E342E',
            textColor: '#6D4C41',
            slideBackground: '#FFF3E0',
            pageBackground: {
                type: 'color',
                color: '#FBE9E7',
                imageUrl: '',
            },
            accentBlocksColor: '#E65100',
            secondaryButtonColor: '#FB8C00',
        },
        typography: {
            headingFont: 'merriweather',
            bodyFont: 'inter',
        },
        design: {
            slide: {
                borderRadius: '8px',
                borderColor: '#E65100',
                shadow: 'sm',
                borderWidth: 'thin',
                imageShape: 'round',
                opacity: 0.9,
            },
        },
    }),
    createTheme('ocean-breeze', {
        name: 'Ocean Breeze',
        description: 'Cool blues inspired by the sea',
        colors: {
            primaryAccent: '#0288D1',
            shapesColor: '#0288D1',
            secondaryAccents: ['#03A9F4', '#81D4FA', '#4DD0E1'],
            headingColor: '#01579B',
            textColor: '#0277BD',
            slideBackground: '#E1F5FE',
            pageBackground: {
                type: 'color',
                color: '#B3E5FC',
                imageUrl: '',
            },
            accentBlocksColor: '#0288D1',
            secondaryButtonColor: '#03A9F4',
        },
        typography: {
            headingFont: 'poppins',
            bodyFont: 'poppins',
        },
    }),
    createTheme('forest-whisper', {
        name: 'Forest Whisper',
        description: 'Soft greens of a peaceful forest',
        colors: {
            primaryAccent: '#2E7D32',
            shapesColor: '#2E7D32',
            secondaryAccents: ['#4CAF50', '#81C784', '#388E3C'],
            headingColor: '#1B5E20',
            textColor: '#2E7D32',
            slideBackground: '#E8F5E9',
            pageBackground: {
                type: 'color',
                color: '#C8E6C9',
                imageUrl: '',
            },
            accentBlocksColor: '#2E7D32',
            secondaryButtonColor: '#4CAF50',
        },
        typography: {
            headingFont: 'roboto',
            bodyFont: 'roboto',
        },
    }),
    createTheme('sunset-glow', {
        name: 'Sunset Glow',
        description: 'Vibrant oranges and reds of sunset',
        colors: {
            primaryAccent: '#D84315',
            shapesColor: '#D84315',
            secondaryAccents: ['#FF7043', '#FFAB91', '#FF5722'],
            headingColor: '#BF360C',
            textColor: '#E64A19',
            slideBackground: '#FBE9E7',
            pageBackground: {
                type: 'color',
                color: '#FFCCBC',
                imageUrl: '',
            },
            accentBlocksColor: '#D84315',
            secondaryButtonColor: '#FF7043',
        },
        typography: {
            headingFont: 'poppins',
            bodyFont: 'inter',
        },
    }),
    createTheme('minimal-light', {
        name: 'Minimal Light',
        description: 'Clean light theme with blue accents',
        colors: {
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
            bodyFont: 'inter',
        },
        design: {
            slide: {
                borderRadius: '8px',
                borderColor: '#E5E7EB',
                borderWidth: 'thin',
                shadow: 'sm',
                imageShape: 'round',
                opacity: 1,
            },
        },
    }),
    createTheme('minimal-dark', {
        name: 'Minimal Dark',
        description: 'Dark background with bright blue accents',
        colors: {
            primaryAccent: '#2563EB',
            shapesColor: '#2563EB',
            secondaryAccents: ['#60A5FA', '#93C5FD', '#F3F4F6'],
            headingColor: '#F3F4F6',
            textColor: '#D1D5DB',
            slideBackground: '#1F2937',
            pageBackground: {
                type: 'color',
                color: '#111827',
                imageUrl: '',
            },
            accentBlocksColor: '#2563EB',
            secondaryButtonColor: '#3B82F6',
        },
        typography: {
            headingFont: 'inter',
            bodyFont: 'inter',
        },
        design: {
            slide: {
                borderRadius: '8px',
                borderColor: '#374151',
                borderWidth: 'thin',
                shadow: 'sm',
                imageShape: 'round',
                opacity: 0.9,
            },
        },
    }),
    createTheme('corporate-blue', {
        name: 'Corporate Blue',
        description: 'Professional theme with subtle blues',
        colors: {
            primaryAccent: '#1D4ED8',
            shapesColor: '#1D4ED8',
            secondaryAccents: ['#2563EB', '#3B82F6', '#93C5FD'],
            headingColor: '#1E293B',
            textColor: '#334155',
            slideBackground: '#FFFFFF',
            pageBackground: {
                type: 'color',
                color: '#F8FAFC',
                imageUrl: '',
            },
            accentBlocksColor: '#1D4ED8',
            secondaryButtonColor: '#2563EB',
        },
        typography: {
            headingFont: 'roboto',
            bodyFont: 'roboto',
        },
    }),
    createTheme('retro-pop', {
        name: 'Retro Pop',
        description: 'Bright and playful retro colors',
        colors: {
            primaryAccent: '#E91E63',
            shapesColor: '#E91E63',
            secondaryAccents: ['#9C27B0', '#F48FB1', '#CE93D8'],
            headingColor: '#880E4F',
            textColor: '#AD1457',
            slideBackground: '#FCE4EC',
            pageBackground: {
                type: 'color',
                color: '#F8BBD0',
                imageUrl: '',
            },
            accentBlocksColor: '#E91E63',
            secondaryButtonColor: '#9C27B0',
        },
        typography: {
            headingFont: 'lato',
            bodyFont: 'lato',
        },
    }),
    createTheme('neon-night', {
        name: 'Neon Night',
        description: 'Dark theme with glowing neon accents',
        colors: {
            primaryAccent: '#00E5FF',
            shapesColor: '#00E5FF',
            secondaryAccents: ['#18FFFF', '#1DE9B6', '#FF4081'],
            headingColor: '#E0E0E0',
            textColor: '#B0BEC5',
            slideBackground: '#263238',
            pageBackground: {
                type: 'color',
                color: '#000000',
                imageUrl: '',
            },
            accentBlocksColor: '#00E5FF',
            secondaryButtonColor: '#FF4081',
        },
        typography: {
            headingFont: 'poppins',
            bodyFont: 'poppins',
        },
        design: {
            slide: {
                borderRadius: '8px',
                borderColor: '#00E5FF',
                borderWidth: 'thin',
                shadow: 'md',
                imageShape: 'round',
                opacity: 1,
            },
        },
    }),
    createTheme('elegant-purple', {
        name: 'Elegant Purple',
        description: 'Refined look with purple accents',
        colors: {
            primaryAccent: '#8E24AA',
            shapesColor: '#8E24AA',
            secondaryAccents: ['#BA68C8', '#CE93D8', '#E1BEE7'],
            headingColor: '#4A148C',
            textColor: '#6A1B9A',
            slideBackground: '#F3E5F5',
            pageBackground: {
                type: 'color',
                color: '#EDE7F6',
                imageUrl: '',
            },
            accentBlocksColor: '#8E24AA',
            secondaryButtonColor: '#BA68C8',
        },
        typography: {
            headingFont: 'merriweather',
            bodyFont: 'inter',
        },
    }),
];

