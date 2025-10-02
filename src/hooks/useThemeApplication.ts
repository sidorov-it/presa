/* eslint-disable indent, prettier/prettier, no-nested-ternary */
import { useEffect, useRef, useCallback } from 'react';
import { Theme } from '@/types/theme';
import { BackgroundSettings } from '@/types';
import { ColorMode } from '@/components/ui/color-mode';
import generateCSSVariablesFromTheme from '@/utils/themeCssGenerator';

interface UseThemeApplicationOptions {
    theme: Theme | null;
    backgroundSettings?: BackgroundSettings;
    setColorMode?: (mode: 'light' | 'dark') => void;
    colorMode?: ColorMode;
    defaultThemes?: Theme[];
    externalRef?: React.RefObject<HTMLDivElement>;
    previousBackgroundSettings?: BackgroundSettings;
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
    previousBackgroundSettings,
}: {
    container: HTMLDivElement;
    theme: Theme;
    colorMode?: 'light' | 'dark';
    backgroundSettings?: BackgroundSettings;
    setColorMode?: (mode: 'light' | 'dark') => void;
    previousTheme?: Theme | null;
    previousBackgroundSettings?: BackgroundSettings;
}) => {
    // Generate CSS variables using the unified generator
    const result = generateCSSVariablesFromTheme({
        theme,
        backgroundSettings,
        previousTheme
    });

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

    // Helper function to remove CSS variable from both container and document
    const removeCSSVariable = (property: string) => {
        container.style.removeProperty(property);
        document.documentElement.style.removeProperty(property);
    };

    // Apply all CSS variables with change detection
    Object.entries(result.variables).forEach(([property, value]) => {
        // Get previous value for comparison
        let oldValue: string | undefined;
        if (previousTheme) {
            const prevResult = generateCSSVariablesFromTheme({
                theme: previousTheme,
                backgroundSettings: previousBackgroundSettings,
                previousTheme: null
            });
            oldValue = prevResult.variables[property];
        }

        // If the new value is undefined or empty, remove the variable
        if (value === undefined || value === '') {
            if (oldValue !== undefined && oldValue !== '') {
                removeCSSVariable(property);
            }
        } else {
            setCSSVariableIfChanged(property, value, oldValue);
        }
    });

    // Handle background image changes separately for better control
    let currentImageUrl;
    if (backgroundSettings?.backgroundImage === 'none') {
        currentImageUrl = '';
    } else if (backgroundSettings?.backgroundImage !== 'none') {
        currentImageUrl = backgroundSettings?.backgroundImage;
    } else {
        currentImageUrl = theme.colors.pageBackground?.imageUrl?.trim() || '';
    }

    // const currentImageUrl = backgroundSettings?.backgroundImage !== 'none'
    //     ? backgroundSettings?.backgroundImage
    //     : theme.colors.pageBackground?.imageUrl?.trim() || '';

    const prevImageUrl = previousBackgroundSettings?.backgroundImage !== 'none'
        ? previousBackgroundSettings?.backgroundImage
        : previousTheme?.colors.pageBackground?.imageUrl?.trim() || '';

    if (currentImageUrl !== prevImageUrl) {
        if (currentImageUrl === 'none' || currentImageUrl === '') {
            removeCSSVariable('--presentation-page-background-image');
            removeCSSVariable('--presentation-page-background-size');
            removeCSSVariable('--presentation-page-background-position');
            removeCSSVariable('--presentation-page-background-repeat');
            removeCSSVariable('--presentation-page-background-attachment');
            container.style.backgroundImage = 'none';
        } else if (currentImageUrl) {
            container.style.setProperty('--presentation-page-background-image', `url(${currentImageUrl})`);
            document.documentElement.style.setProperty('--presentation-page-background-image', `url(${currentImageUrl})`);
            container.style.backgroundImage = `url(${currentImageUrl})`;
            container.style.backgroundSize = 'cover';
            container.style.backgroundPosition = 'center';
            container.style.backgroundRepeat = 'no-repeat';
            container.style.backgroundAttachment = 'fixed';
        }
    }

    // Apply background styles
    Object.entries(result.backgroundStyles).forEach(([property, value]) => {
        if (value !== undefined && value !== null) {
            container.style.setProperty(property, String(value));
        }
    });

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
    const previousBackgroundSettingsRef = useRef<BackgroundSettings | null>(null);
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
                    previousBackgroundSettings: previousBackgroundSettingsRef.current || undefined,
                });
                appliedThemeHashRef.current = themeHash;
                previousThemeRef.current = { ...activeTheme }; // Store deep copy
                previousBackgroundSettingsRef.current = backgroundSettings ? { ...backgroundSettings } : null;
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
            previousBackgroundSettingsRef.current = null;
            isApplyingRef.current = false;
            // Cancel any pending debounced calls
            debouncedApplyTheme.cancel?.();
        };
    }, [setColorMode]);

    return { containerRef: internalRef, applyTheme };
};
