import { useEffect, useRef, useCallback } from 'react';
import { Theme } from '@/types/theme';
import getContrastTextColor from '@/utils/getContrastTextColor';
import getHoverColor from '@/utils/getHoverColor';
import { BackgroundSettings } from '@/types';
import { getBorderColorForBackground } from '@/utils/themeUtils';

interface UseThemeApplicationOptions {
    theme: Theme | null;
    backgroundSettings?: BackgroundSettings;
    setColorMode?: (mode: 'light' | 'dark') => void;
    defaultThemes?: Theme[];
    externalRef?: React.RefObject<HTMLDivElement>;
}

const applyThemeStyles = (
    container: HTMLDivElement,
    theme: Theme,
    backgroundSettings?: BackgroundSettings,
    setColorMode?: (mode: 'light' | 'dark') => void
) => {
    // Base colors
    container.style.setProperty('--presentation-primary-accent', theme.colors.primaryAccent);
    container.style.setProperty('--presentation-accent-blocks-color', theme.colors.primaryAccent);

    // container.style.setProperty('--presentation-accent-blocks-text-color', theme.colors.primaryAccentTextColor);

    // Text colors
    container.style.setProperty('--presentation-heading-color', theme.typography.headingColor);
    container.style.setProperty('--presentation-text-color', theme.typography.bodyColor);
    container.style.setProperty('--presentation-slide-background', theme.colors.slideBackground);

    // Handle page background
    if (theme.colors.pageBackground || backgroundSettings?.backgroundColor) {
        if (backgroundSettings?.backgroundColor) {
            container.style.setProperty('--presentation-page-background-color', backgroundSettings.backgroundColor);
        } else if (theme.colors.pageBackground.color) {
            container.style.setProperty('--presentation-page-background-color', theme.colors.pageBackground.color);
        } else {
            container.style.setProperty('--presentation-page-background-color', '#f9fafb');
        }

        if (theme.colors.pageBackground.imageUrl || backgroundSettings?.backgroundImage) {
            let imageUrl;

            if (backgroundSettings?.backgroundImage) {
                if (backgroundSettings?.backgroundImage !== 'none') {
                    imageUrl = backgroundSettings.backgroundImage;
                }
            } else {
                imageUrl = theme.colors.pageBackground.imageUrl?.trim();
            }

            if (imageUrl) {
                container.style.setProperty('--presentation-page-background-image', `url(${imageUrl})`);
                container.style.backgroundImage = `url(${imageUrl})`;
                container.style.backgroundSize = 'cover';
                container.style.backgroundPosition = 'center';
                container.style.backgroundRepeat = 'no-repeat';
                container.style.backgroundAttachment = 'fixed';

                container.style.setProperty('--presentation-page-background-size', 'cover');
                container.style.setProperty('--presentation-page-background-position', 'center');
                container.style.setProperty('--presentation-page-background-repeat', 'no-repeat');
                container.style.setProperty('--presentation-page-background-attachment', 'fixed');
            } else {
                container.style.removeProperty('--presentation-page-background-image');
                container.style.backgroundImage = 'none';
            }
        } else {
            container.style.removeProperty('--presentation-page-background-image');
            container.style.backgroundImage = 'none';
        }
    } else {
        container.style.setProperty('--presentation-page-background-color', '#f9fafb');
        container.style.removeProperty('--presentation-page-background-image');
    }

    // Typography
    container.style.setProperty('--presentation-heading-font', `'${theme.typography.headingFont}', sans-serif`);
    container.style.setProperty('--presentation-heading-weight', theme.typography.headingWeight.toString());
    container.style.setProperty('--presentation-body-font', `'${theme.typography.bodyFont}', sans-serif`);
    container.style.setProperty('--presentation-body-weight', theme.typography.bodyWeight.toString());

    // Heading typography
    container.style.setProperty('--presentation-heading-line-height', theme.typography.headingLineHeight.toString());
    container.style.setProperty('--presentation-heading-letter-spacing', theme.typography.headingLetterSpacing + 'px');
    container.style.setProperty(
        '--presentation-heading-capitalization',
        theme.typography.headingCapitalization === 'none' ? 'none' : 'uppercase'
    );

    // Body typography
    container.style.setProperty('--presentation-body-line-height', theme.typography.bodyLineHeight.toString());
    container.style.setProperty('--presentation-body-letter-spacing', theme.typography.bodyLetterSpacing + 'px');
    container.style.setProperty(
        '--presentation-body-capitalization',
        theme.typography.bodyCapitalization === 'none' ? 'none' : 'uppercase'
    );

    // Slide design
    container.style.setProperty('--presentation-slide-border-radius', theme.design.slide.borderRadius);

    container.style.setProperty('--presentation-slide-opacity', theme.design.slide.opacity.toString());

    // Shadow
    const shadow = theme.design.slide.shadow;
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

    // Border width
    const borderWidthMap = {
        none: '0px',
        thin: '3px',
        medium: '4px',
        thick: '5px',
    };
    container.style.setProperty(
        '--presentation-slide-border-width',
        borderWidthMap[theme.design.slide.borderWidth] || '0px'
    );

    container.style.setProperty('--presentation-slide-border-color', theme.design.slide.borderColor);

    // Image masks
    const getMaskImages = (imageShape: string | null) => {
        const maskMap = {
            default: { left: 'none', right: 'none', top: 'none' },
            fade: {
                left: 'url(/masks/gradient-left.svg)',
                right: 'url(/masks/gradient-right.svg)',
                top: 'url(/masks/gradient-top.svg)',
            },
            diagonal: {
                left: 'url(/masks/diagonal-left.svg)',
                right: 'url(/masks/diagonal-right.svg)',
                top: 'url(/masks/diagonal-top.svg)',
            },
            round: {
                left: 'url(/masks/circle-left.svg)',
                right: 'url(/masks/circle-right.svg)',
                top: 'url(/masks/circle-top.svg)',
            },
            'round-inverse': {
                left: 'url(/masks/circle-inverted-left.svg)',
                right: 'url(/masks/circle-inverted-right.svg)',
                top: 'url(/masks/circle-inverted-top.svg)',
            },
            wiggle: {
                left: 'url(/masks/wiggle-left.svg)',
                right: 'url(/masks/wiggle-right.svg)',
                top: 'url(/masks/wiggle-top.svg)',
            },
        };
        if (!imageShape) {
            return maskMap.default;
        }

        return maskMap[imageShape as keyof typeof maskMap];
    };

    const maskImages = getMaskImages(theme.design.slide.imageShape);
    container.style.setProperty('--presentation-slide-image-mask-image-left', maskImages.left);
    container.style.setProperty('--presentation-slide-image-mask-image-right', maskImages.right);
    container.style.setProperty('--presentation-slide-image-mask-image-top', maskImages.top);

    // Block design
    container.style.setProperty('--presentation-block-fill-type', theme.design.blocks.backgroundBlockFillType);

    if (theme.design.blocks.backgroundBlockFillType === 'fill') {
        container.style.setProperty('--presentation-block-background-opacity', '1');
    } else if (theme.design.blocks.backgroundBlockFillType === 'semi') {
        container.style.setProperty('--presentation-block-background-opacity', '0.5');
    } else if (theme.design.blocks.backgroundBlockFillType === 'none') {
        container.style.setProperty('--presentation-block-background-opacity', '0');
    }

    const blockBorderWidthMap = {
        none: '0px',
        thin: '3px',
        medium: '4px',
        thick: '5px',
    };
    container.style.setProperty(
        '--presentation-block-border-width',
        blockBorderWidthMap[theme.design.blocks.borderWidth] || '0px'
    );

    if (theme.design.blocks.blockFillColorsType !== 'custom') {
        container.style.setProperty('--presentation-block-background', theme.colors.primaryAccent);
        container.style.setProperty(
            '--presentation-block-border-color',
            getBorderColorForBackground(theme.colors.primaryAccent)
        );

        container.style.setProperty(
            '--presentation-block-background-custom-type',
            theme.design.blocks.blockFillColorsType
        );
    } else if (theme.design.blocks.blockFillColorsType === 'custom') {
        theme.design.blocks.blockBackgroundCustomColors.forEach((color, index) => {
            container.style.setProperty(`--presentation-block-background-custom-${index + 1}`, color);
            container.style.setProperty(
                `--presentation-block-border-color-custom-${index + 1}`,
                getBorderColorForBackground(color)
            );
        });
        container.style.setProperty(
            '--presentation-block-background-custom-count',
            theme.design.blocks.blockBackgroundCustomColors.length.toString()
        );
    }

    const shadowMap = [
        { value: 'none', shadow: 'none' },
        { value: 'sm', shadow: '0 1px 2px 0 rgb(0 0 0 / 0.2)' },
        { value: 'md', shadow: '0 4px 6px -1px rgb(0 0 0 / 0.4)' },
    ];

    if (theme.design.blocks.shadow === 'none') {
        container.style.setProperty('--presentation-block-shadow', 'none');
    } else if (theme.design.blocks.shadow === 'sm') {
        container.style.setProperty('--presentation-block-shadow', shadowMap[1].shadow);
    } else if (theme.design.blocks.shadow === 'md') {
        container.style.setProperty('--presentation-block-shadow', shadowMap[2].shadow);
    }

    if (theme.design.buttons.buttonColor) {
        container.style.setProperty('--presentation-button-color', theme.design.buttons.buttonColor);

        const hoverColor = getHoverColor(theme.design.buttons.buttonColor, 15);
        container.style.setProperty('--presentation-button-hover-color', hoverColor);
        container.style.setProperty(
            '--presentation-button-text-color',
            getContrastTextColor(theme.design.buttons.buttonColor)
        );
    }
    // Button and link design

    const buttonRadiusMap = {
        square: '1.5px',
        capsule: 'var(--chakra-radii-full)',
        default: '4px',
        rounded: '8px',
    };
    container.style.setProperty(
        '--presentation-button-radius',
        buttonRadiusMap[theme.design.buttons.buttonShape] || '4px'
    );

    container.style.setProperty(
        '--presentation-link-color',
        theme.design.buttons.linkColor || theme.colors.primaryAccent
    );

    // Set color mode if provided
    if (setColorMode) {
        const isDarkMode = (function isColorDark(color: string) {
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

        setColorMode(isDarkMode ? 'dark' : 'light');
    }
};

const validateTheme = (theme: Theme): boolean => {
    if (!theme.colors || !theme.typography || !theme.design) {
        console.error('Theme is missing required properties', {
            hasColors: !!theme.colors,
            hasTypography: !!theme.typography,
            hasDesign: !!theme.design,
        });
        return false;
    }

    if (!theme.design.slide || !theme.design.blocks || !theme.design.buttons) {
        console.error('Theme design is missing required properties', {
            hasSlide: !!theme.design.slide,
            hasBlocks: !!theme.design.blocks,
            hasButtons: !!theme.design.buttons,
        });
        return false;
    }

    return true;
};

export const useThemeApplication = (options: UseThemeApplicationOptions) => {
    const { theme, backgroundSettings, setColorMode, defaultThemes, externalRef } = options;
    const appliedThemeRef = useRef<string | null>(null);
    const internalRef = useRef<HTMLDivElement>(null);

    // Use external ref if provided, otherwise use internal ref
    const containerRef = externalRef || internalRef;

    const applyTheme = useCallback(
        (container: HTMLDivElement) => {
            // Use default theme if no theme is provided and defaultThemes available
            let activeTheme = theme;
            if (!activeTheme && defaultThemes && defaultThemes.length > 0) {
                activeTheme = defaultThemes[0];
            }

            if (!activeTheme) {
                return;
            }

            // Check if we already applied this exact theme
            const themeId = activeTheme.id || activeTheme.name;
            if (appliedThemeRef.current === themeId) {
                return;
            }

            if (!validateTheme(activeTheme)) {
                return;
            }

            try {
                applyThemeStyles(container, activeTheme, backgroundSettings, setColorMode);
                appliedThemeRef.current = themeId;
            } catch (error) {
                console.error('Error applying theme', error);
            }
        },
        [theme, backgroundSettings, setColorMode, defaultThemes]
    );

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        applyTheme(container);

        return () => {
            if (container) {
                container.removeAttribute('style');
            }
            if (setColorMode) {
                setColorMode('light');
            }
            appliedThemeRef.current = null;
        };
    }, [applyTheme, setColorMode, containerRef]);

    return { containerRef: internalRef, applyTheme };
};
