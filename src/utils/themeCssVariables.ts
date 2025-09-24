import { Theme } from '@/types/theme';
import { BackgroundSettings } from '@/types';
import generateCSSVariablesFromTheme from './themeCssGenerator';

/**
 * Convert theme settings to a style object with CSS variables.
 * This is a compatibility wrapper around the unified CSS variable generator.
 */
export function themeToCSSVariables(theme: Theme, backgroundSettings?: BackgroundSettings): React.CSSProperties {
    const result = generateCSSVariablesFromTheme({
        theme,
        backgroundSettings,
    });

    // Return both CSS variables and background styles as a single style object
    return {
        ...result.variables,
        ...result.backgroundStyles,
    } as React.CSSProperties;
}

export default themeToCSSVariables;
