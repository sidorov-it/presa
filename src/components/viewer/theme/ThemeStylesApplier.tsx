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
import getContrastTextColor from '@/utils/getContrastTextColor';
import getHoverColor from '@/utils/getHoverColor';
import { useColorMode } from '@/components/ui/color-mode';
import { BackgroundSettings } from '@/types';

interface ThemeStylesApplierProps {
    theme: Theme | null;
    backgroundSettings?: BackgroundSettings;
    children: React.ReactNode;
    className?: string;
}

const ThemeStylesApplier: React.FC<ThemeStylesApplierProps> = ({
    theme,
    backgroundSettings,
    children,
    className = '',
}) => {
    // Use ref to avoid re-applying the same theme
    const appliedThemeRef = useRef<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { setColorMode } = useColorMode();

    // Apply theme to the container when the component mounts or theme changes
    useEffect(() => {
        const container = containerRef.current;
        const activeTheme = theme;

        if (!container || !activeTheme) {
            return;
        }

        // Check if we already applied this exact theme
        const themeId = activeTheme.id || activeTheme.name;
        if (appliedThemeRef.current === themeId) {
            return;
        }

        // Check if theme structure is complete
        if (!activeTheme.colors || !activeTheme.typography || !activeTheme.design) {
            console.error('ThemeStylesApplier: Theme is missing required properties', {
                hasColors: !!activeTheme.colors,
                hasTypography: !!activeTheme.typography,
                hasDesign: !!activeTheme.design,
            });

            return;
        }

        // Further validate theme structure
        if (!activeTheme.design.slide || !activeTheme.design.blocks || !activeTheme.design.buttons) {
            console.error('ThemeStylesApplier: Theme design is missing required properties', {
                hasSlide: !!activeTheme.design.slide,
                hasBlocks: !!activeTheme.design.blocks,
                hasButtons: !!activeTheme.design.buttons,
            });
            return;
        }

        try {
            // Apply theme to the document root
            // Base colors
            container.style.setProperty('--presentation-primary-accent', activeTheme.colors.primaryAccent);

            // Set secondary accent colors (limit to first 3)
            if (activeTheme.colors.secondaryAccents && Array.isArray(activeTheme.colors.secondaryAccents)) {
                activeTheme.colors.secondaryAccents.slice(0, 3).forEach((color, index) => {
                    container.style.setProperty(`--presentation-secondary-accent-${index + 1}`, color);
                });
            }

            container.style.setProperty(
                '--presentation-shapes-color',
                activeTheme.colors.shapesColor || activeTheme.colors.primaryAccent
            );
            container.style.setProperty(
                '--presentation-accent-blocks-color',
                activeTheme.colors.accentBlocksColor || activeTheme.colors.primaryAccent
            );
            container.style.setProperty(
                '--presentation-secondary-button-color',
                activeTheme.colors.secondaryButtonColor || '#6b7280'
            );

            // Set default theme text colors (these can be overridden by slide-specific colors)
            container.style.setProperty('--presentation-heading-color', activeTheme.colors.headingColor);
            container.style.setProperty('--presentation-text-color', activeTheme.colors.textColor);
            container.style.setProperty('--presentation-slide-background', activeTheme.colors.slideBackground);

            // Handle page background
            if (activeTheme.colors.pageBackground || backgroundSettings?.backgroundColor) {
                if (backgroundSettings?.backgroundColor) {
                    container.style.setProperty(
                        '--presentation-page-background-color',
                        backgroundSettings.backgroundColor
                    );
                } else if (activeTheme.colors.pageBackground.color) {
                    container.style.setProperty(
                        '--presentation-page-background-color',
                        activeTheme.colors.pageBackground.color
                    );
                } else {
                    container.style.setProperty('--presentation-page-background-color', '#f9fafb');
                }

                if (activeTheme.colors.pageBackground.imageUrl || backgroundSettings?.backgroundImage) {
                    // Check if URL is valid
                    let imageUrl;

                    if (backgroundSettings?.backgroundImage) {
                        if (backgroundSettings?.backgroundImage !== 'none') {
                            imageUrl = backgroundSettings.backgroundImage;
                        }
                    } else {
                        imageUrl = activeTheme.colors.pageBackground.imageUrl.trim();
                    }
                    // const imageUrl = backgroundSettings?.backgroundImage || theme.colors.pageBackground.imageUrl.trim();
                    if (imageUrl) {
                        container.style.setProperty('--presentation-page-background-image', `url(${imageUrl})`);

                        // Apply background directly on the container element
                        container.style.backgroundImage = `url(${imageUrl})`;
                        container.style.backgroundSize = 'cover';
                        container.style.backgroundPosition = 'center';
                        container.style.backgroundRepeat = 'no-repeat';
                        container.style.backgroundAttachment = 'fixed';

                        // Ensure image is properly styled
                        container.style.setProperty('--presentation-page-background-size', 'cover');
                        container.style.setProperty('--presentation-page-background-position', 'center');
                        container.style.setProperty('--presentation-page-background-repeat', 'no-repeat');
                        container.style.setProperty('--presentation-page-background-attachment', 'fixed');
                    } else {
                        console.warn('Background image URL is empty or invalid');
                        container.style.removeProperty('--presentation-page-background-image');
                        container.style.backgroundImage = 'none';
                    }
                } else {
                    container.style.removeProperty('--presentation-page-background-image');
                    container.style.backgroundImage = 'none';
                }
            } else {
                // Default background if none defined
                container.style.setProperty('--presentation-page-background-color', '#f9fafb');
                container.style.removeProperty('--presentation-page-background-image');
            }
            // Typography
            container.style.setProperty(
                '--presentation-heading-font',
                `'${activeTheme.typography.headingFont}', sans-serif`
            );
            container.style.setProperty(
                '--presentation-heading-weight',
                activeTheme.typography.headingWeight.toString()
            );
            container.style.setProperty('--presentation-body-font', `'${activeTheme.typography.bodyFont}', sans-serif`);
            container.style.setProperty('--presentation-body-weight', activeTheme.typography.bodyWeight.toString());

            // New typography CSS vars for headings
            container.style.setProperty(
                '--presentation-heading-line-height',
                activeTheme.typography.headingLineHeight.toString()
            );
            container.style.setProperty(
                '--presentation-heading-letter-spacing',
                activeTheme.typography.headingLetterSpacing + '%'
            );

            if (activeTheme.typography.headingCapitalization === 'none') {
                container.style.setProperty('--presentation-heading-capitalization', 'none');
            } else {
                container.style.setProperty('--presentation-heading-capitalization', 'uppercase');
            }
            // New typography CSS vars for body text
            container.style.setProperty(
                '--presentation-body-line-height',
                activeTheme.typography.bodyLineHeight.toString()
            );
            container.style.setProperty(
                '--presentation-body-letter-spacing',
                activeTheme.typography.bodyLetterSpacing + '%'
            );

            if (activeTheme.typography.bodyCapitalization === 'none') {
                container.style.setProperty('--presentation-body-capitalization', 'none');
            } else {
                container.style.setProperty('--presentation-body-capitalization', 'uppercase');
            }

            container.style.setProperty(
                '--presentation-body-capitalization',
                activeTheme.typography.bodyCapitalization
            );

            // Slide design
            container.style.setProperty('--presentation-slide-border-radius', activeTheme.design.slide.borderRadius);

            const shadow = activeTheme.design.slide.shadow;
            if (shadow === 'none') {
                container.style.setProperty('--presentation-slide-shadow', 'none');
            } else if (shadow === 'sm') {
                container.style.setProperty(
                    '--presentation-slide-shadow',
                    '0 10px 15px -3px rgba(0, 0, 0, 0.1),0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                );
            } else if (shadow === 'md') {
                container.style.setProperty('--presentation-slide-shadow', 'rgba(0, 0, 0, 0.4) 4px 4px 0px 0px');
            }

            const borderWidth = activeTheme.design.slide.borderWidth;

            if (borderWidth === 'none') {
                container.style.setProperty('--presentation-slide-border-width', '0px');
            } else if (borderWidth === 'thin') {
                container.style.setProperty('--presentation-slide-border-width', '1px');
            } else if (borderWidth === 'medium') {
                container.style.setProperty('--presentation-slide-border-width', '2px');
            } else if (borderWidth === 'thick') {
                container.style.setProperty('--presentation-slide-border-width', '3px');
            }

            container.style.setProperty('--presentation-slide-border-color', activeTheme.design.slide.borderColor);

            let maskImageLeft = 'none';
            let maskImageRight = 'none';
            let maskImageTop = 'none';

            if (activeTheme.imageShape === 'default') {
                maskImageLeft = 'none';
                maskImageRight = 'none';
                maskImageTop = 'none';
            } else if (activeTheme.imageShape === 'fade') {
                maskImageLeft = `url(/masks/gradient-left.svg)`;
                maskImageRight = `url(/masks/gradient-right.svg)`;
                maskImageTop = `url(/masks/gradient-top.svg)`;
            } else if (activeTheme.imageShape === 'diagonal') {
                maskImageLeft = `url(/masks/diagonal-left.svg)`;
                maskImageRight = `url(/masks/diagonal-right.svg)`;
                maskImageTop = `url(/masks/diagonal-top.svg)`;
            } else if (activeTheme.imageShape === 'round') {
                maskImageLeft = `url(/masks/circle-left.svg)`;
                maskImageRight = `url(/masks/circle-right.svg)`;
                maskImageTop = `url(/masks/circle-top.svg)`;
            } else if (activeTheme.imageShape === 'round-inverse') {
                maskImageLeft = `url(/masks/circle-inverted-left.svg)`;
                maskImageRight = `url(/masks/circle-inverted-right.svg)`;
                maskImageTop = `url(/masks/circle-inverted-top.svg)`;
            } else if (activeTheme.imageShape === 'wiggle') {
                maskImageLeft = `url(/masks/wiggle-left.svg)`;
                maskImageRight = `url(/masks/wiggle-right.svg)`;
                maskImageTop = `url(/masks/wiggle-top.svg)`;
            }

            container.style.setProperty('--presentation-slide-image-mask-image-left', maskImageLeft);
            container.style.setProperty('--presentation-slide-image-mask-image-right', maskImageRight);
            container.style.setProperty('--presentation-slide-image-mask-image-top', maskImageTop);

            // Block design
            container.style.setProperty(
                '--presentation-block-fill-type',
                activeTheme.design.blocks.backgroundBlockFillType
            );

            let blockBorderWidth = '0px';
            if (activeTheme.design.blocks.borderWidth === 'none') {
                blockBorderWidth = '0px';
            } else if (activeTheme.design.blocks.borderWidth === 'thin') {
                blockBorderWidth = '1px';
            } else if (activeTheme.design.blocks.borderWidth === 'medium') {
                blockBorderWidth = '2px';
            } else if (activeTheme.design.blocks.borderWidth === 'thick') {
                blockBorderWidth = '3px';
            }

            container.style.setProperty('--presentation-block-border-width', blockBorderWidth);

            if (activeTheme.design.blocks.blockFillColorsType !== 'custom') {
                container.style.setProperty('--presentation-block-background', activeTheme.colors.primaryAccent);

                container.style.setProperty(
                    '--presentation-block-background-custom-type',
                    activeTheme.design.blocks.blockFillColorsType
                );
            } else if (activeTheme.design.blocks.blockFillColorsType === 'custom') {
                activeTheme.design.blocks.blockBackgroundCustomColors.forEach((color, index) => {
                    container.style.setProperty(`--presentation-block-background-custom-${index + 1}`, color);
                });

                container.style.setProperty(
                    '--presentation-block-background-custom-count',
                    activeTheme.design.blocks.blockBackgroundCustomColors.length.toString()
                );
            }

            container.style.setProperty('--presentation-block-shadow', activeTheme.design.blocks.shadow);

            // Button and link design
            container.style.setProperty('--presentation-button-color', activeTheme.design.buttons.buttonColor);

            const hoverColor = getHoverColor(activeTheme.design.buttons.buttonColor, 15);
            container.style.setProperty('--presentation-button-hover-color', hoverColor);
            container.style.setProperty(
                '--presentation-button-text-color',
                getContrastTextColor(activeTheme.design.buttons.buttonColor)
            );

            if (activeTheme.design.buttons.buttonShape === 'square') {
                container.style.setProperty('--presentation-button-radius', '1.5px');
            } else if (activeTheme.design.buttons.buttonShape === 'capsule') {
                container.style.setProperty('--presentation-button-radius', 'var(--chakra-radii-full)');
            } else if (activeTheme.design.buttons.buttonShape === 'default') {
                container.style.setProperty('--presentation-button-radius', '4px');
            } else if (activeTheme.design.buttons.buttonShape === 'rounded') {
                container.style.setProperty('--presentation-button-radius', '8px');
            }

            container.style.setProperty(
                '--presentation-link-color',
                activeTheme.design.buttons.linkColor || activeTheme.colors.primaryAccent
            );

            // Определяем isDarkMode и устанавливаем colorMode Chakra
            let isDarkMode = false;
            if (activeTheme && activeTheme.colors && activeTheme.colors.slideBackground) {
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
                })(activeTheme.colors.slideBackground);
            }

            setColorMode(isDarkMode ? 'dark' : 'light');

            // Mark theme as applied
            appliedThemeRef.current = themeId;
        } catch (error) {
            console.error('ThemeStylesApplier: Error applying theme', error);
        }

        // Clean up function
        return () => {
            if (container) {
                container.removeAttribute('style');
            }
            setColorMode('light');
            appliedThemeRef.current = null;
        };
    }, [theme, setColorMode, backgroundSettings]);

    return (
        <div ref={containerRef} className={className}>
            {children}
        </div>
    );
};

export default ThemeStylesApplier;
