import { defineConfig, createSystem, defaultConfig } from '@chakra-ui/react';

// Define custom theme configuration
const config = defineConfig({
    // CSS variables root
    cssVarsRoot: ':where(:root, :host)',

    // CSS variables prefix
    cssVarsPrefix: 'ck',

    // Theme configuration
    theme: {
        // Define breakpoints
        breakpoints: {
            sm: '320px',
            md: '768px',
            lg: '960px',
            xl: '1200px',
        },

        // Design tokens
        tokens: {
            colors: {
                background: {
                    DEFAULT: { value: '#F7F9FC' },
                    dark: { value: '#1A202C' },
                },
                text: {
                    DEFAULT: { value: '#2D3748' },
                    dark: { value: '#F7FAFC' },
                },
                primary: {
                    50: { value: '#E3F2FD' },
                    100: { value: '#BBDEFB' },
                    200: { value: '#90CAF9' },
                    300: { value: '#64B5F6' },
                    400: { value: '#42A5F5' },
                    500: { value: '#2196F3' },
                    600: { value: '#1E88E5' },
                    700: { value: '#1976D2' },
                    800: { value: '#1565C0' },
                    900: { value: '#0D47A1' },
                },
            },
            spacing: {
                '2': { value: '0.5rem' },
                '4': { value: '1rem' },
                '8': { value: '2rem' },
            },
            // borderColor: {
            //     DEFAULT: { value: '#E2E8F0' },
            // },
            // boxShadow: {
            //     outline: { value: '0 0 0 3px rgba(66, 153, 225, 0.6)' },
            // },
        },

        // Semantic tokens (references to base tokens)
        semanticTokens: {
            colors: {
                brand: { value: '{colors.primary.500}' },
                accent: { value: '{colors.primary.700}' },
                buttonPrimary: { value: '{colors.primary.500}' },
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
