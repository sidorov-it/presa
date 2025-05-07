'use client';

import circleInvertedLeftImage from '@/elements/masks/circle-inverted-left.svg';
import circleInvertedRightImage from '@/elements/masks/circle-inverted-right.svg';
import circleLeftImage from '@/elements/masks/circle-left.svg';
import circleRightImage from '@/elements/masks/circle-right.svg';
import diagonalLeftImage from '@/elements/masks/diagonal-left.svg';
import diagonalRightImage from '@/elements/masks/diagonal-right.svg';
import gradientLeftImage from '@/elements/masks/gradient-left.svg';
import gradientRightImage from '@/elements/masks/gradient-right.svg';
import gradientTopImage from '@/elements/masks/gradient-top.svg';
import wiggleLeftImage from '@/elements/masks/wiggle-left.svg';
import wiggleRightImage from '@/elements/masks/wiggle-right.svg';
import wiggleTopImage from '@/elements/masks/wiggle-top.svg';
import diagonalTopImage from '@/elements/masks/diagonal-top.svg';
import circleTopImage from '@/elements/masks/circle-top.svg';
import circleInvertedTopImage from '@/elements/masks/circle-inverted-top.svg';

import { useEffect, useRef } from 'react';
import { Theme } from '@/types/theme';
import { resetThemeStyles } from '@/utils/themeUtils';
import getContrastTextColor from '@/utils/getContrastTextColor';
import getHoverColor from '@/utils/getHoverColor';
import { useColorMode } from '@/components/ui/color-mode';

interface ThemeStylesApplierProps {
    theme: Theme | null;
}

const ThemeStylesApplier: React.FC<ThemeStylesApplierProps> = ({ theme }) => {
    // Use ref to avoid re-applying the same theme
    const appliedThemeRef = useRef<string | null>(null);
    const { setColorMode } = useColorMode();
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
                theme.colors.primaryAccent
                // theme.colors.accentBlocksColor
            );
            document.documentElement.style.setProperty(
                '--presentation-secondary-button-color',
                theme.colors.secondaryButtonColor
            );

            document.documentElement.style.setProperty('--presentation-heading-color', theme.colors.headingColor);
            document.documentElement.style.setProperty('--presentation-text-color', theme.colors.textColor);
            document.documentElement.style.setProperty('--presentation-slide-background', theme.colors.slideBackground);

            if (theme.colors.pageBackground.color) {
                document.documentElement.style.setProperty(
                    '--presentation-page-background-color',
                    theme.colors.pageBackground.color
                );
            } else {
                document.documentElement.style.removeProperty('--presentation-page-background-color');
            }

            if (theme.colors.pageBackground.imageUrl) {
                document.documentElement.style.setProperty(
                    '--presentation-page-background-image',
                    `url(${theme.colors.pageBackground.imageUrl})`
                );
            } else {
                document.documentElement.style.removeProperty('--presentation-page-background-image');
            }
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

            let maskImageLeft = 'none';
            let maskImageRight = 'none';
            let maskImageTop = 'none';

            if (theme.design.slide.imageShape === 'default') {
                maskImageLeft = 'none';
                maskImageRight = 'none';
                maskImageTop = 'none';
            } else if (theme.design.slide.imageShape === 'fade') {
                maskImageLeft = `url(${gradientLeftImage.src})`;
                maskImageRight = `url(${gradientRightImage.src})`;
                maskImageTop = `url(${gradientTopImage.src})`;
            } else if (theme.design.slide.imageShape === 'diagonal') {
                maskImageLeft = `url(${diagonalLeftImage.src})`;
                maskImageRight = `url(${diagonalRightImage.src})`;
                maskImageTop = `url(${diagonalTopImage.src})`;
            } else if (theme.design.slide.imageShape === 'round') {
                maskImageLeft = `url(${circleLeftImage.src})`;
                maskImageRight = `url(${circleRightImage.src})`;
                maskImageTop = `url(${circleTopImage.src})`;
            } else if (theme.design.slide.imageShape === 'round-inverse') {
                maskImageLeft = `url(${circleInvertedLeftImage.src})`;
                maskImageRight = `url(${circleInvertedRightImage.src})`;
                maskImageTop = `url(${circleInvertedTopImage.src})`;
            } else if (theme.design.slide.imageShape === 'wiggle') {
                maskImageLeft = `url(${wiggleLeftImage.src})`;
                maskImageRight = `url(${wiggleRightImage.src})`;
                maskImageTop = `url(${wiggleTopImage.src})`;
            }

            document.documentElement.style.setProperty('--presentation-slide-image-mask-image-left', maskImageLeft);
            document.documentElement.style.setProperty('--presentation-slide-image-mask-image-right', maskImageRight);
            document.documentElement.style.setProperty('--presentation-slide-image-mask-image-top', maskImageTop);

            // Block design
            document.documentElement.style.setProperty(
                '--presentation-block-fill-type',
                theme.design.blocks.backgroundFillType
            );

            let blockBorderWidth = '0px';
            if (theme.design.blocks.borderWidth === 'none') {
                blockBorderWidth = '0px';
            } else if (theme.design.blocks.borderWidth === 'thin') {
                blockBorderWidth = '1px';
            } else if (theme.design.blocks.borderWidth === 'medium') {
                blockBorderWidth = '2px';
            } else if (theme.design.blocks.borderWidth === 'thick') {
                blockBorderWidth = '3px';
            }

            document.documentElement.style.setProperty('--presentation-block-border-width', blockBorderWidth);

            if (theme.design.blocks.blockFillColorsType !== 'custom') {
                document.documentElement.style.setProperty(
                    '--presentation-block-background',
                    theme.colors.primaryAccent
                );

                document.documentElement.style.setProperty(
                    '--presentation-block-background-custom-type',
                    theme.design.blocks.blockFillColorsType
                );
            } else if (theme.design.blocks.blockFillColorsType === 'custom') {
                theme.design.blocks.blockBackgroundCustomColors.forEach((color, index) => {
                    document.documentElement.style.setProperty(
                        `--presentation-block-background-custom-${index + 1}`,
                        color
                    );
                });

                document.documentElement.style.setProperty(
                    '--presentation-block-background-custom-count',
                    theme.design.blocks.blockBackgroundCustomColors.length.toString()
                );
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

            // Определяем isDarkMode и устанавливаем colorMode Chakra
            let isDarkMode = false;
            if (theme && theme.colors && theme.colors.slideBackground) {
                isDarkMode = (function isColorDark(color) {
                    if (color.startsWith('#')) {
                        const hex = color.replace('#', '');
                        const r = parseInt(hex.substring(0, 2), 16);
                        const g = parseInt(hex.substring(2, 4), 16);
                        const b = parseInt(hex.substring(4, 6), 16);
                        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                        return brightness < 128;
                    }
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
                    return false;
                })(theme.colors.slideBackground);
            }

            // Устанавливаем colorMode Chakra вместо класса dark-theme
            setColorMode(isDarkMode ? 'dark' : 'light');

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
    }, [theme, setColorMode]);

    // This component doesn't render anything
    return null;
};

export default ThemeStylesApplier;
