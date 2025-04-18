'use client';

import { useEffect, useRef } from 'react';
import { Theme } from '@/types/theme';
import { resetThemeStyles } from '@/utils/themeUtils';

// Utility function to determine if a color is dark
const isColorDark = (color: string): boolean => {
    // Handle hex colors
    if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        // Calculate perceived brightness using YIQ formula
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128;
    }

    // Handle rgb/rgba colors
    if (color.startsWith('rgb')) {
        const rgbValues = color.match(/\d+/g);
        if (rgbValues && rgbValues.length >= 3) {
            const r = parseInt(rgbValues[0]);
            const g = parseInt(rgbValues[1]);
            const b = parseInt(rgbValues[2]);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness < 128;
        }
    }

    // Default to false for other color formats
    return false;
};

interface ThemeStylesApplierProps {
    theme: Theme | null;
}

const ThemeStylesApplier: React.FC<ThemeStylesApplierProps> = ({ theme }) => {
    // Use ref to avoid re-applying the same theme
    const appliedThemeRef = useRef<string | null>(null);

    // Apply theme to the DOM when the component mounts or theme changes
    useEffect(() => {
        if (!theme) {
            console.log('ThemeStylesApplier: No theme provided');
            return;
        }

        // Check if we already applied this exact theme
        const themeId = theme.id || theme.name;
        if (appliedThemeRef.current === themeId) {
            console.log('ThemeStylesApplier: Theme already applied, skipping', theme.name);
            return;
        }

        console.log('ThemeStylesApplier: Applying theme', theme.name);

        // Check if theme structure is complete
        if (!theme.colors || !theme.typography || !theme.design) {
            console.error('ThemeStylesApplier: Theme is missing required properties', {
                hasColors: !!theme.colors,
                hasTypography: !!theme.typography,
                hasDesign: !!theme.design,
            });

            // Print the theme object for debugging
            console.log('Theme object:', JSON.stringify(theme, null, 2));
            return;
        }

        // Further validate theme structure
        if (!theme.design.slide || !theme.design.blocks || !theme.design.buttons) {
            console.error('ThemeStylesApplier: Theme design is missing required properties', {
                hasSlide: !!theme.design.slide,
                hasBlocks: !!theme.design.blocks,
                hasButtons: !!theme.design.buttons,
            });
            return;
        }

        try {
            // Apply theme to the document root
            // Base colors
            document.documentElement.style.setProperty('--primary-accent', theme.colors.primaryAccent);
            document.documentElement.style.setProperty('--heading-color', theme.colors.headingColor);
            document.documentElement.style.setProperty('--text-color', theme.colors.textColor);
            document.documentElement.style.setProperty('--slide-background', theme.colors.slideBackground);

            // Set page background based on type
            if (theme.colors.pageBackground.type === 'color') {
                document.documentElement.style.setProperty(
                    '--page-background-color',
                    theme.colors.pageBackground.color
                );
            } else {
                document.documentElement.style.setProperty(
                    '--page-background-image',
                    `url(${theme.colors.pageBackground.imageUrl})`
                );
            }

            document.documentElement.style.setProperty('--page-background-type', theme.colors.pageBackground.type);

            // Typography
            document.documentElement.style.setProperty(
                '--heading-font',
                `'${theme.typography.headingFont}', sans-serif`
            );
            document.documentElement.style.setProperty('--heading-weight', theme.typography.headingWeight.toString());
            document.documentElement.style.setProperty('--body-font', `'${theme.typography.bodyFont}', sans-serif`);
            document.documentElement.style.setProperty('--body-weight', theme.typography.bodyWeight.toString());

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
            document.documentElement.style.setProperty('--button-color', theme.design.buttons.buttonColor);
            document.documentElement.style.setProperty('--button-shape', theme.design.buttons.buttonShape);
            document.documentElement.style.setProperty('--link-color', theme.design.buttons.linkColor);

            // Check if the slide background is dark and set control variables accordingly
            const isDark = isColorDark(theme.colors.slideBackground);

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

            // Mark theme as applied
            appliedThemeRef.current = themeId;
            console.log('ThemeStylesApplier: Theme applied successfully');
        } catch (error) {
            console.error('ThemeStylesApplier: Error applying theme', error);
        }

        // Clean up function
        return () => {
            // Use the utility function to reset theme styles on unmount
            resetThemeStyles();

            // Reset the applied theme reference
            appliedThemeRef.current = null;
            console.log('ThemeStylesApplier: Theme reset to defaults on unmount');
        };
    }, [theme]);

    // This component doesn't render anything
    return null;
};

export default ThemeStylesApplier;
