'use client';

import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import { Theme } from '@/types/theme';
import { useThemeStore } from '@/store/themeStore';
import { isColorDark } from '@/context/ThemeContext';
import ThemeStylesApplier from '@/components/viewer/theme/ThemeStylesApplier';
import { resetThemeStyles } from '@/utils/themeUtils';

interface ThemeContextType {
    currentTheme: Theme | null;
    setTheme: (theme: Theme) => void;
    isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
    initialTheme?: Theme | null;
}

export const ThemeProvider = ({ children, initialTheme }: ThemeProviderProps) => {
    const { currentTheme: storeTheme, setCurrentTheme, getDefaultTheme, loadThemes } = useThemeStore();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [currentTheme, setCurrentThemeState] = useState<Theme | null>(initialTheme || storeTheme || null);

    const applyThemeToDOM = (theme: Theme) => {
        // Base colors
        document.documentElement.style.setProperty('--primary-accent', theme.colors.primaryAccent);

        document.documentElement.style.setProperty('--shapes-color', theme.colors.shapesColor);
        document.documentElement.style.setProperty('--buttons-color', theme.colors.buttonsColor);
        document.documentElement.style.setProperty('--links-color', theme.colors.linksColor);

        document.documentElement.style.setProperty('--accent-blocks-color', theme.colors.accentBlocksColor);
        document.documentElement.style.setProperty('--secondary-button-color', theme.colors.secondaryButtonColor);

        document.documentElement.style.setProperty('--heading-color', theme.colors.headingColor);
        document.documentElement.style.setProperty('--text-color', theme.colors.textColor);
        document.documentElement.style.setProperty('--slide-background', theme.colors.slideBackground);

        // Set page background based on type
        if (theme.colors.pageBackground.type === 'color') {
            document.documentElement.style.setProperty('--page-background-color', theme.colors.pageBackground.color);
        } else {
            // image
            document.documentElement.style.setProperty(
                '--page-background-image',
                `url(${theme.colors.pageBackground.imageUrl})`
            );
        }
        document.documentElement.style.setProperty('--page-background-type', theme.colors.pageBackground.type);

        // Typography
        document.documentElement.style.setProperty('--heading-font', `'${theme.typography.headingFont}', sans-serif`);
        document.documentElement.style.setProperty('--heading-weight', theme.typography.headingWeight.toString());
        document.documentElement.style.setProperty('--body-font', `'${theme.typography.bodyFont}', sans-serif`);
        document.documentElement.style.setProperty('--body-weight', theme.typography.bodyWeight.toString());
        // New typography CSS vars for headings
        document.documentElement.style.setProperty(
            '--heading-line-height',
            theme.typography.headingLineHeight.toString()
        );
        document.documentElement.style.setProperty(
            '--heading-letter-spacing',
            theme.typography.headingLetterSpacing + '%'
        );
        document.documentElement.style.setProperty('--heading-capitalization', theme.typography.headingCapitalization);
        // New typography CSS vars for body text
        document.documentElement.style.setProperty('--body-line-height', theme.typography.bodyLineHeight.toString());
        document.documentElement.style.setProperty('--body-letter-spacing', theme.typography.bodyLetterSpacing + '%');
        document.documentElement.style.setProperty('--body-capitalization', theme.typography.bodyCapitalization);

        // Slide design
        document.documentElement.style.setProperty('--slide-border-radius', theme.design.slide.borderRadius);
        document.documentElement.style.setProperty('--slide-shadow', theme.design.slide.shadow);
        document.documentElement.style.setProperty('--slide-border', theme.design.slide.border);
        document.documentElement.style.setProperty('--slide-border-color', theme.design.slide.borderColor);

        // Block design
        document.documentElement.style.setProperty('--block-background', theme.design.blocks.backgroundColor);
        document.documentElement.style.setProperty('--block-opacity', theme.design.blocks.opacity.toString());

        let blockBorderWidth = '0';
        if (theme.design.blocks.borderWidth === 'thin') {
            blockBorderWidth = '1px';
        } else if (theme.design.blocks.borderWidth === 'medium') {
            blockBorderWidth = '2px';
        } else if (theme.design.blocks.borderWidth === 'thick') {
            blockBorderWidth = '4px';
        }
        document.documentElement.style.setProperty('--block-border-width', blockBorderWidth);
        document.documentElement.style.setProperty('--block-shadow', theme.design.blocks.shadow);

        // Button and link design
        // document.documentElement.style.setProperty('--button-color', theme.design.buttons.buttonColor);
        document.documentElement.style.setProperty('--button-shape', theme.design.buttons.buttonShape);
        // document.documentElement.style.setProperty('--link-color', theme.design.buttons.linkColor);

        // Check if the slide background is dark and set control variables accordingly
        const isDark = isColorDark(theme.colors.slideBackground);
        setIsDarkMode(isDark);

        // Control variables - the single place these should be set dynamically
        document.documentElement.style.setProperty('--control-stroke', isDark ? 'white' : 'rgba(0, 0, 0, 0.2)');
        document.documentElement.style.setProperty('--control-icon', isDark ? 'white' : 'rgba(0, 0, 0, 0.6)');
        document.documentElement.style.setProperty(
            '--control-background',
            isDark ? 'rgba(0, 0, 0, 0.5)' : 'transparent'
        );

        // Toggle dark-theme class on body for additional theme-specific styles
        if (isDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    };

    // Set theme function that updates both the state and the store
    const setTheme = (theme: Theme) => {
        console.log('ThemeProvider: Setting theme', theme.name);
        setCurrentThemeState(theme);
        setCurrentTheme(theme); // Update zustand store
    };

    // Handle initialTheme when it's provided
    useEffect(() => {
        if (initialTheme) {
            console.log('ThemeProvider: Using initialTheme', initialTheme.name);
            setCurrentThemeState(initialTheme);
        }

        // Return cleanup function to reset everything when component unmounts
        return () => {
            console.log('ThemeProvider: Cleaning up on unmount');

            // Use utility function to reset theme styles
            resetThemeStyles();

            // Don't update state in cleanup as it can cause infinite loops
            // const defaultTheme = getDefaultTheme();
            // setCurrentThemeState(defaultTheme);
            // setCurrentTheme(defaultTheme);
        };
    }, [initialTheme]);

    // Load themes when the provider is initialized
    useEffect(() => {
        loadThemes().catch(error => {
            console.error('Failed to load themes:', error);
        });
    }, [loadThemes]);

    useEffect(() => {
        // Apply theme when currentTheme changes
        if (currentTheme) {
            applyThemeToDOM(currentTheme);
        } else if (storeTheme) {
            // Use store theme as fallback
            applyThemeToDOM(storeTheme);
            setCurrentThemeState(storeTheme);
        } else {
            // Apply default theme if no theme is selected
            const defaultTheme = getDefaultTheme();
            applyThemeToDOM(defaultTheme);
            setCurrentThemeState(defaultTheme);
        }
    }, [currentTheme, storeTheme, getDefaultTheme]);

    const value = {
        currentTheme,
        setTheme,
        isDarkMode,
    };

    return (
        <ThemeContext.Provider value={value}>
            {/* Use ThemeStylesApplier to apply the theme directly */}
            {/* <ThemeStylesApplier theme={currentTheme} /> */}
            {children}
        </ThemeContext.Provider>
    );
};
