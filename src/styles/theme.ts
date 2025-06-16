import { defineConfig, createSystem, defaultConfig } from '@chakra-ui/react';

// Define custom theme configuration
const config = defineConfig({
    // CSS variables root
    cssVarsRoot: ':where(:root, :host)',

    // CSS variables prefix
    // cssVarsPrefix: 'ck',

    // Theme configuration
    theme: {
        // Define breakpoints
        breakpoints: {
            sm: '320px',
            md: '768px',
            lg: '960px',
            xl: '1200px',
        },

        textStyles: {},
        // Design tokens
        tokens: {
            colors: {
                background: {
                    DEFAULT: { value: '#FFFFFF' } /* White */,
                    dark: { value: '#0B0B0B' } /* Jet Black */,
                },
                text: {
                    DEFAULT: { value: '#F5F5F5' } /* Cool White */,
                    dark: { value: '#F5F5F5' } /* Cool White */,
                },
                primary: {
                    50: { value: '#E3F2FF' },
                    100: { value: '#CCE6FF' },
                    200: { value: '#99CCFF' },
                    300: { value: '#66B3FF' },
                    400: { value: '#3399FF' },
                    500: { value: '#007BFF' } /* Electric Blue */,
                    600: { value: '#0066CC' },
                    700: { value: '#004C99' },
                    800: { value: '#003366' },
                    900: { value: '#001A33' },
                },
                secondary: {
                    50: { value: '#F0F0FF' },
                    100: { value: '#E1E1FF' },
                    200: { value: '#C3C3FF' },
                    300: { value: '#A5A5FF' },
                    400: { value: '#8787FF' },
                    500: { value: '#6C63FF' } /* Indigo Purple */,
                    600: { value: '#5B52E6' },
                    700: { value: '#4A41CC' },
                    800: { value: '#3A30B3' },
                    900: { value: '#291F99' },
                },
                accent: {
                    50: { value: '#E6FFFF' },
                    100: { value: '#CCFFFF' },
                    200: { value: '#99FFFF' },
                    300: { value: '#66FFFF' },
                    400: { value: '#33FFFF' },
                    500: { value: '#2563EB' } /* Blue 600 */,
                    600: { value: '#00CCCC' },
                    700: { value: '#009999' },
                    800: { value: '#006666' },
                    900: { value: '#003333' },
                },
                surface: {
                    DEFAULT: { value: '#1E1E1E' } /* Charcoal Gray */,
                },
                border: {
                    DEFAULT: { value: '#3A3F4B' } /* Slate Gray */,
                },
                muted: {
                    DEFAULT: { value: '#A0A0A0' } /* Steel Gray */,
                },
            },
            spacing: {
                '2': { value: '0.5rem' },
                '4': { value: '1rem' },
                '8': { value: '2rem' },
            },
        },

        // Semantic tokens (references to base tokens)
        semanticTokens: {
            colors: {
                brand: { value: '{colors.primary.500}' } /* Electric Blue */,
                accent: { value: '{colors.accent.500}' } /* Neon Cyan */,
                buttonPrimary: { value: '{colors.primary.500}' } /* Electric Blue */,
                buttonSecondary: { value: '{colors.secondary.500}' } /* Indigo Purple */,
            },
        },

        // Define animations
        keyframes: {
            spin: {
                from: { transform: 'rotate(0deg)' },
                to: { transform: 'rotate(360deg)' },
            },
        },
    },

    // Component customizations
    // components: {
    //     Button: {
    //         defaultProps: {
    //     colorScheme: 'primary',
    // },
    //     },
    // },
});

// Create the styling system
const system = createSystem(defaultConfig, config);

export { system };
