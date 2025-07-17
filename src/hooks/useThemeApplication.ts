/* eslint-disable indent, prettier/prettier, no-nested-ternary */
import { useEffect, useRef, useCallback } from 'react';
import { Theme } from '@/types/theme';
import getContrastTextColor from '@/utils/getContrastTextColor';
import getHoverColor from '@/utils/getHoverColor';
import { BackgroundSettings } from '@/types';
import { getBorderColorForBackground, getContrastingTextColor, getSubtleColor } from '@/utils/themeUtils';
import { ColorMode } from '@/components/ui/color-mode';

interface UseThemeApplicationOptions {
    theme: Theme | null;
    backgroundSettings?: BackgroundSettings;
    setColorMode?: (mode: 'light' | 'dark') => void;
    colorMode?: ColorMode;
    defaultThemes?: Theme[];
    externalRef?: React.RefObject<HTMLDivElement>;
}

// Helper function to create a hash of theme properties for comparison
const createThemeHash = (theme: Theme, backgroundSettings?: BackgroundSettings): string => {
    // Create a stable, ordered representation of the theme data
    const themeData = {
        id: theme.id,
        name: theme.name,
        colors: {
            primaryAccent: theme.colors.primaryAccent,
            slideBackground: theme.colors.slideBackground,
            pageBackground: theme.colors.pageBackground,
        },
        typography: {
            headingFont: theme.typography.headingFont,
            headingColor: theme.typography.headingColor,
            headingWeight: theme.typography.headingWeight,
            headingLineHeight: theme.typography.headingLineHeight,
            headingLetterSpacing: theme.typography.headingLetterSpacing,
            headingCapitalization: theme.typography.headingCapitalization,
            bodyFont: theme.typography.bodyFont,
            bodyColor: theme.typography.bodyColor,
            bodyWeight: theme.typography.bodyWeight,
            bodyLineHeight: theme.typography.bodyLineHeight,
            bodyLetterSpacing: theme.typography.bodyLetterSpacing,
            bodyCapitalization: theme.typography.bodyCapitalization,
        },
        design: {
            slide: theme.design.slide,
            blocks: theme.design.blocks,
            buttons: theme.design.buttons,
        },
        backgroundSettings: backgroundSettings
            ? {
                backgroundColor: backgroundSettings.backgroundColor,
                backgroundImage: backgroundSettings.backgroundImage,
            }
            : null,
    };
    return JSON.stringify(themeData);
};

// Debounce utility function with cancel support
const debounce = <T extends (...args: any[]) => void>(func: T, wait: number): T & { cancel: () => void } => {
    let timeout: NodeJS.Timeout | null = null;

    const debouncedFunction = ((...args: any[]) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    }) as T & { cancel: () => void };

    debouncedFunction.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return debouncedFunction;
};

const applyThemeStyles = ({
    container,
    theme,
    colorMode,
    backgroundSettings,
    setColorMode,
    previousTheme,
}: {
    container: HTMLDivElement;
    theme: Theme;
    colorMode?: 'light' | 'dark';
    backgroundSettings?: BackgroundSettings;
    setColorMode?: (mode: 'light' | 'dark') => void;
    previousTheme?: Theme | null;
}) => {
    // Helper function to set CSS variable only if it changed
    const setCSSVariableIfChanged = (
        property: string,
        newValue: string,
        oldValue?: string
    ) => {
        // Force set on first render (when previousTheme is null)
        // or when values actually changed
        if (previousTheme === null || newValue !== oldValue) {
            container.style.setProperty(property, newValue);
            document.documentElement.style.setProperty(property, newValue);
        }
    };

    // Get previous values for comparison
    const prevColors = previousTheme?.colors;
    const prevTypography = previousTheme?.typography;
    const prevDesign = previousTheme?.design;

    // Base colors
    setCSSVariableIfChanged('--presentation-primary-accent', theme.colors.primaryAccent, prevColors?.primaryAccent);
    setCSSVariableIfChanged('--presentation-primary-accent-contrast-text-color', getContrastingTextColor(theme.colors.primaryAccent), prevColors?.primaryAccent);
    setCSSVariableIfChanged(
        '--presentation-accent-blocks-color',
        theme.colors.primaryAccent,
        prevColors?.primaryAccent
    );

    // Text colors
    setCSSVariableIfChanged(
        '--presentation-heading-color',
        theme.typography.headingColor,
        prevTypography?.headingColor
    );
    setCSSVariableIfChanged('--presentation-text-color', theme.typography.bodyColor, prevTypography?.bodyColor);
    setCSSVariableIfChanged(
        '--presentation-slide-background',
        theme.colors.slideBackground,
        prevColors?.slideBackground
    );

    // Handle page background
    if (theme.colors.pageBackground || backgroundSettings?.backgroundColor) {
        let backgroundColor;
        if (backgroundSettings?.backgroundColor) {
            backgroundColor = backgroundSettings.backgroundColor;
        } else if (theme.colors.pageBackground.color) {
            backgroundColor = theme.colors.pageBackground.color;
        } else {
            backgroundColor = '#f9fafb';
        }

        const prevBackgroundColor = prevColors?.pageBackground?.color || '#f9fafb';
        setCSSVariableIfChanged('--presentation-page-background-color', backgroundColor, prevBackgroundColor);

        // Handle background image
        let imageUrl = '';
        if (backgroundSettings?.backgroundImage && backgroundSettings.backgroundImage !== 'none') {
            imageUrl = backgroundSettings.backgroundImage;
        } else if (theme.colors.pageBackground.imageUrl?.trim()) {
            imageUrl = theme.colors.pageBackground.imageUrl.trim();
        }

        const prevImageUrl = prevColors?.pageBackground?.imageUrl?.trim() || '';

        if (imageUrl !== prevImageUrl) {
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
        }
    } else {
        setCSSVariableIfChanged('--presentation-page-background-color', '#f9fafb');
        if (!previousTheme || previousTheme.colors.pageBackground?.imageUrl) {
            container.style.removeProperty('--presentation-page-background-image');
            container.style.backgroundImage = 'none';
        }
    }

    // Typography
    setCSSVariableIfChanged(
        '--presentation-heading-font',
        `'${theme.typography.headingFont}', sans-serif`,
        prevTypography ? `'${prevTypography.headingFont}', sans-serif` : undefined
    );
    setCSSVariableIfChanged(
        '--presentation-heading-weight',
        theme.typography.headingWeight.toString(),
        prevTypography?.headingWeight.toString()
    );
    setCSSVariableIfChanged(
        '--presentation-body-font',
        `'${theme.typography.bodyFont}', sans-serif`,
        prevTypography ? `'${prevTypography.bodyFont}', sans-serif` : undefined
    );
    setCSSVariableIfChanged(
        '--presentation-body-weight',
        theme.typography.bodyWeight.toString(),
        prevTypography?.bodyWeight.toString()
    );

    // Heading typography
    setCSSVariableIfChanged(
        '--presentation-heading-line-height',
        theme.typography.headingLineHeight.toString(),
        prevTypography?.headingLineHeight.toString()
    );
    setCSSVariableIfChanged(
        '--presentation-heading-letter-spacing',
        theme.typography.headingLetterSpacing + 'px',
        prevTypography ? prevTypography.headingLetterSpacing + 'px' : undefined
    );

    const headingCapitalization = theme.typography.headingCapitalization === 'none' ? 'none' : 'uppercase';
    const prevHeadingCapitalization = prevTypography
        ? prevTypography.headingCapitalization === 'none'
            ? 'none'
            : 'uppercase'
        : undefined;
    setCSSVariableIfChanged('--presentation-heading-capitalization', headingCapitalization, prevHeadingCapitalization);

    // Body typography
    setCSSVariableIfChanged(
        '--presentation-body-line-height',
        theme.typography.bodyLineHeight.toString(),
        prevTypography?.bodyLineHeight.toString()
    );
    setCSSVariableIfChanged(
        '--presentation-body-letter-spacing',
        theme.typography.bodyLetterSpacing + 'px',
        prevTypography ? prevTypography.bodyLetterSpacing + 'px' : undefined
    );

    const bodyCapitalization = theme.typography.bodyCapitalization === 'none' ? 'none' : 'uppercase';
    const prevBodyCapitalization = prevTypography
        ? prevTypography.bodyCapitalization === 'none'
            ? 'none'
            : 'uppercase'
        : undefined;
    setCSSVariableIfChanged('--presentation-body-capitalization', bodyCapitalization, prevBodyCapitalization);

    // Slide design
    setCSSVariableIfChanged(
        '--presentation-slide-border-radius',
        theme.design.slide.borderRadius,
        prevDesign?.slide.borderRadius
    );
    setCSSVariableIfChanged(
        '--presentation-slide-opacity',
        theme.design.slide.opacity.toString(),
        prevDesign?.slide.opacity.toString()
    );

    // Shadow
    const shadow = theme.design.slide.shadow;
    const prevShadow = prevDesign?.slide.shadow;
    const boxShadowColor = theme.design.slide.borderColor || 'rgba(0, 0, 0, 0.1)';
    const prevBoxShadowColor = prevDesign?.slide.borderColor || 'rgba(0, 0, 0, 0.1)';

    if (shadow !== prevShadow || boxShadowColor !== prevBoxShadowColor) {
        if (shadow === 'none') {
            container.style.setProperty('--presentation-slide-shadow', 'none');
        } else if (shadow === 'sm') {
            container.style.setProperty(
                '--presentation-slide-shadow',
                `0 10px 15px -3px ${boxShadowColor},0 4px 6px -2px ${boxShadowColor}`
            );
        } else if (shadow === 'md') {
            container.style.setProperty('--presentation-slide-shadow', `${boxShadowColor} 4px 4px 0px 0px`);
        }
    }

    // Border width
    const borderWidthMap: Record<string, string> = {
        none: '0',
        thin: '0.0625em',
        medium: '0.125em',
        thick: '0.175em',
    };

    setCSSVariableIfChanged(
        '--presentation-slide-border-width',
        borderWidthMap[theme.design.slide.borderWidth] || '0px',
        prevDesign ? borderWidthMap[prevDesign.slide.borderWidth] || '0px' : undefined
    );

    setCSSVariableIfChanged(
        '--presentation-slide-border-color',
        theme.design.slide.borderColor,
        prevDesign?.slide.borderColor
    );

    // Image masks
    const getMaskImages = (imageShape: string | null | undefined) => {
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

        return maskMap[imageShape as keyof typeof maskMap] || maskMap.default;
    };

    const maskImages = getMaskImages(theme.design.slide.imageShape);
    const prevMaskImages = getMaskImages(prevDesign?.slide.imageShape);

    setCSSVariableIfChanged('--presentation-slide-image-mask-image-left', maskImages.left, prevMaskImages.left);
    setCSSVariableIfChanged('--presentation-slide-image-mask-image-right', maskImages.right, prevMaskImages.right);
    setCSSVariableIfChanged('--presentation-slide-image-mask-image-top', maskImages.top, prevMaskImages.top);

    // Block design
    setCSSVariableIfChanged(
        '--presentation-block-fill-type',
        theme.design.blocks.backgroundBlockFillType,
        prevDesign?.blocks.backgroundBlockFillType
    );

    const blockOpacityMap = {
        fill: '1',
        semi: '0.5',
        none: '0',
    };
    setCSSVariableIfChanged(
        '--presentation-block-background-opacity',
        blockOpacityMap[theme.design.blocks.backgroundBlockFillType] || '0',
        prevDesign ? blockOpacityMap[prevDesign.blocks.backgroundBlockFillType] || '0' : undefined
    );

    const blockBorderWidthMap = {
        none: '0',
        thin: '0.0625em',
        medium: '0.125em',
        thick: '0.175em',
    };

    setCSSVariableIfChanged(
        '--presentation-block-background-custom-type',
        theme.design.blocks.blockFillColorsType,
        prevDesign?.blocks.blockFillColorsType
    );

    setCSSVariableIfChanged(
        '--presentation-block-border-width',
        blockBorderWidthMap[theme.design.blocks.borderWidth] || '0px',
        prevDesign ? blockBorderWidthMap[prevDesign.blocks.borderWidth] || '0px' : undefined
    );


    // Block fill colors
    if (theme.design.blocks.blockFillColorsType === 'primary') {
        setCSSVariableIfChanged(
            '--presentation-block-background',
            theme.colors.primaryAccent,
            prevDesign?.blocks.blockFillColorsType === 'primary' ? prevColors?.primaryAccent : undefined
        );
        setCSSVariableIfChanged(
            '--presentation-block-border-color',
            getBorderColorForBackground(theme.colors.primaryAccent),
            prevDesign?.blocks.blockFillColorsType === 'primary'
                ? getBorderColorForBackground(theme.colors.primaryAccent || '')
                : undefined
        );

        if (theme.design.blocks.backgroundBlockFillType === 'none') {
            setCSSVariableIfChanged(
                '--presentation-block-text-color',
                theme.typography.bodyColor,
                prevDesign?.blocks.blockFillColorsType === 'primary'
                    ? theme.typography.bodyColor
                    : undefined
            );
        } else {
            setCSSVariableIfChanged(
                '--presentation-block-text-color',
                getContrastTextColor(theme.colors.primaryAccent),
                prevDesign?.blocks.blockFillColorsType === 'primary'
                    ? getContrastTextColor(theme.colors.primaryAccent || '')
                    : undefined
            );
        }
    } else if (theme.design.blocks.blockFillColorsType === 'subtle') {
        const subtleBackground = getSubtleColor(theme.colors.slideBackground);
        setCSSVariableIfChanged(
            '--presentation-block-background-subtle',
            subtleBackground,
            prevDesign?.blocks.blockFillColorsType === 'subtle' ? prevColors?.slideBackground : undefined
        );
        setCSSVariableIfChanged(
            '--presentation-block-border-color-subtle',
            getBorderColorForBackground(subtleBackground),
            prevDesign?.blocks.blockFillColorsType === 'subtle'
                ? getBorderColorForBackground(subtleBackground || '')
                : undefined
        );

        if (theme.design.blocks.backgroundBlockFillType === 'none') {
            setCSSVariableIfChanged(
                '--presentation-block-text-color-subtle',
                theme.typography.bodyColor,
                prevDesign?.blocks.blockFillColorsType === 'subtle'
                    ? theme.typography.bodyColor
                    : undefined
            );
        } else {
            setCSSVariableIfChanged(
                '--presentation-block-text-color-subtle',
                getContrastTextColor(subtleBackground),
                prevDesign?.blocks.blockFillColorsType === 'subtle'
                    ? getContrastTextColor(subtleBackground || '')
                    : undefined
            );
        }
    } else if (theme.design.blocks.blockFillColorsType === 'custom') {
        theme.design.blocks.blockBackgroundCustomColors.forEach((color, index) => {
            const prevColor =
                prevDesign?.blocks.blockFillColorsType === 'custom'
                    ? prevDesign.blocks.blockBackgroundCustomColors[index]
                    : undefined;
            setCSSVariableIfChanged(`--presentation-block-background-custom-${index + 1}`, color, prevColor);
            setCSSVariableIfChanged(
                `--presentation-block-border-color-custom-${index + 1}`,
                getBorderColorForBackground(color),
                prevColor ? getBorderColorForBackground(prevColor) : undefined
            );

            if (theme.design.blocks.backgroundBlockFillType === 'none') {
                setCSSVariableIfChanged(
                    `--presentation-block-text-color-custom-${index + 1}`,
                    theme.typography.bodyColor,
                    prevColor ? theme.typography.bodyColor : undefined
                );
            } else {
                setCSSVariableIfChanged(
                    `--presentation-block-text-color-custom-${index + 1}`,
                    getContrastTextColor(color),
                    prevColor ? getContrastTextColor(prevColor) : undefined
                );
            }
        });
        setCSSVariableIfChanged(
            '--presentation-block-background-custom-count',
            theme.design.blocks.blockBackgroundCustomColors.length.toString(),
            prevDesign?.blocks.blockFillColorsType === 'custom'
                ? prevDesign.blocks.blockBackgroundCustomColors.length.toString()
                : undefined
        );
    }

    // Block shadow
    const shadowMap = {
        none: 'none',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
    };
    setCSSVariableIfChanged(
        '--presentation-block-shadow',
        shadowMap[theme.design.blocks.shadow] || 'none',
        prevDesign ? shadowMap[prevDesign.blocks.shadow] || 'none' : undefined
    );

    // Button colors
    if (theme.design.buttons.buttonColor) {
        setCSSVariableIfChanged(
            '--presentation-button-color',
            theme.design.buttons.buttonColor,
            prevDesign?.buttons.buttonColor
        );

        const hoverColor = getHoverColor(theme.design.buttons.buttonColor, 15);
        const prevHoverColor = prevDesign?.buttons.buttonColor
            ? getHoverColor(prevDesign.buttons.buttonColor, 15)
            : undefined;
        setCSSVariableIfChanged('--presentation-button-hover-color', hoverColor, prevHoverColor);

        const textColor = getContrastTextColor(theme.design.buttons.buttonColor);
        const prevTextColor = prevDesign?.buttons.buttonColor
            ? getContrastTextColor(prevDesign.buttons.buttonColor)
            : undefined;
        setCSSVariableIfChanged('--presentation-button-text-color', textColor, prevTextColor);
    }

    // Button shape
    const buttonRadiusMap = {
        square: '0.09375em',
        capsule: 'var(--chakra-radii-full)',
        default: '0.25em',
        rounded: '0.5em',
    };
    setCSSVariableIfChanged(
        '--presentation-button-radius',
        buttonRadiusMap[theme.design.buttons.buttonShape] || '4px',
        prevDesign ? buttonRadiusMap[prevDesign.buttons.buttonShape] || '4px' : undefined
    );

    // Link color
    const linkColor = theme.design.buttons.linkColor || theme.colors.primaryAccent;
    const prevLinkColor = prevDesign?.buttons.linkColor || prevColors?.primaryAccent;
    setCSSVariableIfChanged('--presentation-link-color', linkColor, prevLinkColor);

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

        const newColorMode = isDarkMode ? 'dark' : 'light';
        if (colorMode !== newColorMode) {
            setColorMode(newColorMode);
        }
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
    const { theme, backgroundSettings, setColorMode, defaultThemes, externalRef, colorMode } = options;
    const appliedThemeHashRef = useRef<string | null>(null);
    const previousThemeRef = useRef<Theme | null>(null);
    const internalRef = useRef<HTMLDivElement>(null);
    const isApplyingRef = useRef(false);

    // Use external ref if provided, otherwise use internal ref
    const containerRef = externalRef || internalRef;

    const applyTheme = useCallback(
        (container: HTMLDivElement) => {
            // Prevent concurrent applications
            if (isApplyingRef.current) {
                return;
            }

            // Use default theme if no theme is provided and defaultThemes available
            let activeTheme = theme;
            if (!activeTheme && defaultThemes && defaultThemes.length > 0) {
                activeTheme = defaultThemes[0];
            }

            if (!activeTheme) {
                return;
            }

            // Check if we already applied this exact theme configuration
            const themeHash = createThemeHash(activeTheme, backgroundSettings);
            if (appliedThemeHashRef.current === themeHash) {
                return;
            }

            if (!validateTheme(activeTheme)) {
                return;
            }

            try {
                isApplyingRef.current = true;
                applyThemeStyles({
                    container,
                    theme: activeTheme,
                    backgroundSettings,
                    setColorMode,
                    colorMode,
                    previousTheme: previousThemeRef.current,
                });
                appliedThemeHashRef.current = themeHash;
                previousThemeRef.current = { ...activeTheme }; // Store deep copy
            } catch (error) {
                console.error('Error applying theme', error);
            } finally {
                isApplyingRef.current = false;
            }
        },
        [theme, backgroundSettings, setColorMode, defaultThemes, colorMode]
    );

    // Create debounced version for rapid changes
    const debouncedApplyTheme = useCallback(
        debounce((container: HTMLDivElement) => {
            applyTheme(container);
        }, 16), // ~60fps for smooth updates
        [applyTheme]
    );

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        // Use debounced version to prevent rapid successive applications
        debouncedApplyTheme(container);
    }, [debouncedApplyTheme, containerRef]);

    useEffect(() => {
        return () => {
            const container = containerRef.current;

            // Only clear styles if we're actually unmounting, not just updating
            if (container && !theme) {
                container.removeAttribute('style');
            }
            if (setColorMode) {
                setColorMode('light');
            }
            appliedThemeHashRef.current = null;
            previousThemeRef.current = null;
            isApplyingRef.current = false;
            // Cancel any pending debounced calls
            debouncedApplyTheme.cancel?.();
        };
    }, [setColorMode]);

    return { containerRef: internalRef, applyTheme };
};
