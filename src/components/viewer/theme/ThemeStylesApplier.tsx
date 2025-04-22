'use client';

import { useEffect, useRef } from 'react';
import { Theme } from '@/types/theme';
import { resetThemeStyles } from '@/utils/themeUtils';
import { useTheme } from '@/context/ThemeContext';
import getContrastTextColor from '@/utils/getContrastTextColor';
import getHoverColor from '@/utils/getHoverColor';

// Utility function to determine if a color is dark
// const isColorDark = (color: string): boolean => {
//     // Handle hex colors
//     if (color.startsWith('#')) {
//         const hex = color.replace('#', '');
//         const r = parseInt(hex.substring(0, 2), 16);
//         const g = parseInt(hex.substring(2, 4), 16);
//         const b = parseInt(hex.substring(4, 6), 16);
//         // Calculate perceived brightness using YIQ formula
//         const brightness = (r * 299 + g * 587 + b * 114) / 1000;
//         return brightness < 128;
//     }

//     // Handle rgb/rgba colors
//     if (color.startsWith('rgb')) {
//         const rgbValues = color.match(/\d+/g);
//         if (rgbValues && rgbValues.length >= 3) {
//             const r = parseInt(rgbValues[0]);
//             const g = parseInt(rgbValues[1]);
//             const b = parseInt(rgbValues[2]);
//             const brightness = (r * 299 + g * 587 + b * 114) / 1000;
//             return brightness < 128;
//         }
//     }

//     // Default to false for other color formats
//     return false;
// };

interface ThemeStylesApplierProps {
    theme: Theme | null;
}

const ThemeStylesApplier: React.FC<ThemeStylesApplierProps> = ({ theme }) => {
    // Use ref to avoid re-applying the same theme
    const appliedThemeRef = useRef<string | null>(null);
    const { isDarkMode } = useTheme();
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
            document.documentElement.style.setProperty('--presentation-primary-accent', theme.colors.primaryAccent);

            // Set secondary accent colors (limit to first 3)
            theme.colors.secondaryAccents.slice(0, 3).forEach((color, index) => {
                document.documentElement.style.setProperty(`--presentation-secondary-accent-${index + 1}`, color);
            });

            document.documentElement.style.setProperty('--presentation-shapes-color', theme.colors.shapesColor);
            document.documentElement.style.setProperty(
                '--presentation-accent-blocks-color',
                theme.colors.accentBlocksColor
            );
            document.documentElement.style.setProperty(
                '--presentation-secondary-button-color',
                theme.colors.secondaryButtonColor
            );

            document.documentElement.style.setProperty('--presentation-heading-color', theme.colors.headingColor);
            document.documentElement.style.setProperty('--presentation-text-color', theme.colors.textColor);
            document.documentElement.style.setProperty('--presentation-slide-background', theme.colors.slideBackground);

            // Set page background based on type
            if (theme.colors.pageBackground.type === 'color') {
                document.documentElement.style.setProperty(
                    '--presentation-page-background-color',
                    theme.colors.pageBackground.color
                );
            } else {
                document.documentElement.style.setProperty(
                    '--presentation-page-background-image',
                    `url(${theme.colors.pageBackground.imageUrl})`
                );
            }

            document.documentElement.style.setProperty(
                '--presentation-page-background-type',
                theme.colors.pageBackground.type
            );

            // Typography
            document.documentElement.style.setProperty(
                '--presentation-heading-font',
                `'${theme.typography.headingFont}', sans-serif`
            );
            document.documentElement.style.setProperty(
                '--presentation-heading-weight',
                theme.typography.headingWeight.toString()
            );
            document.documentElement.style.setProperty(
                '--presentation-body-font',
                `'${theme.typography.bodyFont}', sans-serif`
            );
            document.documentElement.style.setProperty(
                '--presentation-body-weight',
                theme.typography.bodyWeight.toString()
            );

            // New typography CSS vars for headings
            document.documentElement.style.setProperty(
                '--presentation-heading-line-height',
                theme.typography.headingLineHeight.toString()
            );
            document.documentElement.style.setProperty(
                '--presentation-heading-letter-spacing',
                theme.typography.headingLetterSpacing + '%'
            );

            if (theme.typography.headingCapitalization === 'none') {
                document.documentElement.style.setProperty('--presentation-heading-capitalization', 'none');
            } else {
                document.documentElement.style.setProperty('--presentation-heading-capitalization', 'uppercase');
            }
            // New typography CSS vars for body text
            document.documentElement.style.setProperty(
                '--presentation-body-line-height',
                theme.typography.bodyLineHeight.toString()
            );
            document.documentElement.style.setProperty(
                '--presentation-body-letter-spacing',
                theme.typography.bodyLetterSpacing + '%'
            );

            if (theme.typography.bodyCapitalization === 'none') {
                document.documentElement.style.setProperty('--presentation-body-capitalization', 'none');
            } else {
                document.documentElement.style.setProperty('--presentation-body-capitalization', 'uppercase');
            }

            document.documentElement.style.setProperty(
                '--presentation-body-capitalization',
                theme.typography.bodyCapitalization
            );

            // Slide design
            document.documentElement.style.setProperty(
                '--presentation-slide-border-radius',
                theme.design.slide.borderRadius
            );

            const shadow = theme.design.slide.shadow;
            if (shadow === 'none') {
                document.documentElement.style.setProperty('--presentation-slide-shadow', 'none');
            } else if (shadow === 'sm') {
                document.documentElement.style.setProperty(
                    '--presentation-slide-shadow',
                    '0 10px 15px -3px rgba(0, 0, 0, 0.1),0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                );
            } else if (shadow === 'md') {
                document.documentElement.style.setProperty(
                    '--presentation-slide-shadow',
                    'rgba(0, 0, 0, 0.4) 4px 4px 0px 0px'
                );
            }

            const borderWidth = theme.design.slide.borderWidth;

            if (borderWidth === 'none') {
                document.documentElement.style.setProperty('--presentation-slide-border-width', '0px');
            } else if (borderWidth === 'thin') {
                document.documentElement.style.setProperty('--presentation-slide-border-width', '1px');
            } else if (borderWidth === 'medium') {
                document.documentElement.style.setProperty('--presentation-slide-border-width', '2px');
            } else if (borderWidth === 'thick') {
                document.documentElement.style.setProperty('--presentation-slide-border-width', '3px');
            }

            document.documentElement.style.setProperty(
                '--presentation-slide-border-color',
                theme.design.slide.borderColor
            );
            document.documentElement.style.setProperty(
                '--presentation-slide-image-shape',
                theme.design.slide.imageShape
            );

            // Block design
            document.documentElement.style.setProperty(
                '--presentation-block-background',
                theme.design.blocks.backgroundColor
            );
            document.documentElement.style.setProperty(
                '--presentation-block-fill-type',
                theme.design.blocks.backgroundFillType
            );
            document.documentElement.style.setProperty(
                '--presentation-block-border-width',
                theme.design.blocks.borderWidth
            );
            document.documentElement.style.setProperty(
                '--presentation-block-fill-colors-type',
                theme.design.blocks.blockFillColorsType
            );

            if (theme.design.blocks.blockFillColorsType === 'custom') {
                theme.design.blocks.blockBackgroundCustomColors.forEach((color, index) => {
                    document.documentElement.style.setProperty(
                        `--presentation-block-background-custom-${index + 1}`,
                        color
                    );
                });
            }

            document.documentElement.style.setProperty('--presentation-block-shadow', theme.design.blocks.shadow);

            // Button and link design
            document.documentElement.style.setProperty('--presentation-button-color', theme.design.buttons.buttonColor);

            const hoverColor = getHoverColor(theme.design.buttons.buttonColor, 15);
            document.documentElement.style.setProperty('--presentation-button-hover-color', hoverColor);
            document.documentElement.style.setProperty(
                '--presentation-button-text-color',
                getContrastTextColor(theme.design.buttons.buttonColor)
            );

            if (theme.design.buttons.buttonShape === 'square') {
                document.documentElement.style.setProperty('--presentation-button-radius', '1.5px');
            } else if (theme.design.buttons.buttonShape === 'capsule') {
                document.documentElement.style.setProperty('--presentation-button-radius', 'var(--chakra-radii-full)');
            } else if (theme.design.buttons.buttonShape === 'default') {
                document.documentElement.style.setProperty('--presentation-button-radius', '4px');
            } else if (theme.design.buttons.buttonShape === 'rounded') {
                document.documentElement.style.setProperty('--presentation-button-radius', '8px');
            }

            document.documentElement.style.setProperty('--presentation-link-color', theme.design.buttons.linkColor);

            // Control variables - the single place these should be set dynamically
            document.documentElement.style.setProperty(
                '--presentation-control-stroke',
                isDarkMode ? 'white' : 'rgba(0, 0, 0, 0.2)'
            );
            document.documentElement.style.setProperty(
                '--presentation-control-icon',
                isDarkMode ? 'white' : 'rgba(0, 0, 0, 0.6)'
            );
            document.documentElement.style.setProperty(
                '--presentation-control-background',
                isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'transparent'
            );

            // Toggle dark-theme class on body for additional theme-specific styles
            if (isDarkMode) {
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
    }, [theme, isDarkMode]);

    // This component doesn't render anything
    return null;
};

export default ThemeStylesApplier;
