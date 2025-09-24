import { Theme } from '@/types/theme';
import { BackgroundSettings } from '@/types';
import getContrastTextColor from './getContrastTextColor';
import getHoverColor from './getHoverColor';
import { getBorderColorForBackground, getContrastingTextColor, getSubtleColor } from './themeUtils';

/**
 * Interface for CSS variable generator options
 */
export interface CSSVariableGeneratorOptions {
    /** Theme to generate variables for */
    theme: Theme;
    /** Optional background settings override */
    backgroundSettings?: BackgroundSettings;
    /** Previous theme for comparison (used in dynamic updates) */
    previousTheme?: Theme | null;
}

/**
 * Interface for CSS variable generator result
 */
export interface CSSVariableGeneratorResult {
    /** CSS variables as key-value pairs */
    variables: Record<string, string>;
    /** Background styles for direct application */
    backgroundStyles: React.CSSProperties;
}

/**
 * Generate all CSS variables from theme settings
 * This is the single source of truth for CSS variable generation
 */
export function generateCSSVariablesFromTheme(options: CSSVariableGeneratorOptions): CSSVariableGeneratorResult {
    const { theme, backgroundSettings, previousTheme } = options;
    
    const variables: Record<string, string> = {};
    const backgroundStyles: React.CSSProperties = {};
    
    // Helper function to set CSS variable
    const set = (prop: string, value: string | number | undefined) => {
        if (value === undefined) return;
        variables[prop] = String(value);
    };

    // Base colors
    set('--presentation-primary-accent', theme.colors.primaryAccent);
    set('--presentation-primary-accent-contrast-text-color', getContrastingTextColor(theme.colors.primaryAccent));
    set('--presentation-accent-blocks-color', theme.colors.primaryAccent);

    // Text colors
    set('--presentation-heading-color', theme.typography.headingColor);
    set('--presentation-text-color', theme.typography.bodyColor);
    set('--presentation-slide-background', theme.colors.slideBackground);
    set('--presentation-link-color', theme.colors.primaryAccent);

    // Page background
    let backgroundColor: string;
    let imageUrl: string | undefined;
    
    if (theme.colors.pageBackground || backgroundSettings?.backgroundColor) {
        if (backgroundSettings?.backgroundColor) {
            backgroundColor = backgroundSettings.backgroundColor;
        } else if (theme.colors.pageBackground.color) {
            backgroundColor = theme.colors.pageBackground.color;
        } else {
            backgroundColor = '#f9fafb';
        }

        set('--presentation-page-background-color', backgroundColor);

        // Handle background image
        if (backgroundSettings?.backgroundImage && backgroundSettings.backgroundImage !== 'none') {
            imageUrl = backgroundSettings.backgroundImage;
        } else if (theme.colors.pageBackground.imageUrl) {
            imageUrl = theme.colors.pageBackground.imageUrl.trim();
        }
        
        if (imageUrl) {
            set('--presentation-page-background-image', `url(${imageUrl})`);
            set('--presentation-page-background-size', 'cover');
            set('--presentation-page-background-position', 'center');
            set('--presentation-page-background-repeat', 'no-repeat');
            set('--presentation-page-background-attachment', 'fixed');
            
            // Set background styles for direct application
            backgroundStyles.backgroundImage = `url(${imageUrl})`;
            backgroundStyles.backgroundSize = 'cover';
            backgroundStyles.backgroundPosition = 'center';
            backgroundStyles.backgroundRepeat = 'no-repeat';
            backgroundStyles.backgroundAttachment = 'fixed';
        }
    } else {
        backgroundColor = '#f9fafb';
        set('--presentation-page-background-color', backgroundColor);
    }

    // Typography
    set('--presentation-heading-font', `'${theme.typography.headingFont}', sans-serif`);
    set('--presentation-heading-weight', theme.typography.headingWeight);
    set('--presentation-body-font', `'${theme.typography.bodyFont}', sans-serif`);
    set('--presentation-body-weight', theme.typography.bodyWeight);

    // Heading typography
    set('--presentation-heading-line-height', theme.typography.headingLineHeight);
    set('--presentation-heading-letter-spacing', `${theme.typography.headingLetterSpacing}px`);
    set(
        '--presentation-heading-capitalization',
        theme.typography.headingCapitalization === 'none' ? 'none' : 'uppercase'
    );

    // Body typography
    set('--presentation-body-line-height', theme.typography.bodyLineHeight);
    set('--presentation-body-letter-spacing', `${theme.typography.bodyLetterSpacing}px`);
    set('--presentation-body-capitalization', theme.typography.bodyCapitalization === 'none' ? 'none' : 'uppercase');

    // Gamma.app-style responsive font scaling system
    set('--card-font-scale', '1');
    set('--editor-font-size', '1rem');
    set('--viewport-scale-factor', '1.125');
    set(
        '--font-size',
        'calc(1 * var(--card-font-scale, 1) * var(--editor-font-size, 1rem) * var(--zoom-level, 1) * var(--viewport-scale-factor, 1.125))'
    );
    set('--media-scale', 'min(1, var(--card-font-scale, 1))');

    // Slide design
    set('--presentation-slide-border-radius', theme.design.slide.borderRadius);
    set('--presentation-slide-opacity', theme.design.slide.opacity);

    // Shadow
    const shadowMap: Record<string, string> = {
        none: 'none',
        sm: '0 10px 15px -3px rgba(0, 0, 0, 0.1),0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        md: 'rgba(0, 0, 0, 0.4) 4px 4px 0px 0px',
    };
    
    if (theme.design.slide.shadow) {
        if (theme.design.slide.borderColor) {
            set('--presentation-slide-shadow', `${theme.design.slide.borderColor} 4px 4px 0px 0px`);
        } else {
            set('--presentation-slide-shadow', shadowMap[theme.design.slide.shadow]);
        }
    }

    // Border width
    const borderWidthMap: Record<string, string> = {
        none: '0',
        thin: '0.0625em',
        medium: '0.125em',
        thick: '0.175em',
    };

    set('--presentation-slide-border-width', borderWidthMap[theme.design.slide.borderWidth] || '0');
    set('--presentation-slide-border-color', theme.design.slide.borderColor);

    // Image masks
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
    } as const;
    
    const masks = maskMap[(theme.design.slide.imageShape ?? 'default') as keyof typeof maskMap];
    set('--presentation-slide-image-mask-image-left', masks.left);
    set('--presentation-slide-image-mask-image-right', masks.right);
    set('--presentation-slide-image-mask-image-top', masks.top);

    // Block design
    set('--presentation-block-fill-type', theme.design.blocks.backgroundBlockFillType);
    
    const blockOpacityMap = {
        fill: '1',
        semi: '0.5',
        none: '0',
    };
    set('--presentation-block-background-opacity', blockOpacityMap[theme.design.blocks.backgroundBlockFillType] || '0');

    set('--presentation-block-border-width', borderWidthMap[theme.design.blocks.borderWidth] || '0');
    set('--presentation-block-background-custom-type', theme.design.blocks.blockFillColorsType);

    // Set the block fill colors type
    if (theme.design.blocks.blockFillColorsType === 'primary') {
        // For primary type, use the primary accent color
        set('--presentation-block-background', theme.colors.primaryAccent);
        set('--presentation-block-border-color', getBorderColorForBackground(theme.colors.primaryAccent));

        if (theme.design.blocks.backgroundBlockFillType === 'none') {
            set('--presentation-block-text-color', theme.typography.bodyColor);
        } else {
            set('--presentation-block-text-color', getContrastTextColor(theme.colors.primaryAccent));
        }
    } else if (theme.design.blocks.blockFillColorsType === 'subtle') {
        const subtleBackground = getSubtleColor(theme.colors.slideBackground);
        set('--presentation-block-background-subtle', subtleBackground);
        set('--presentation-block-border-color-subtle', getBorderColorForBackground(subtleBackground));

        if (theme.design.blocks.backgroundBlockFillType === 'none') {
            set('--presentation-block-text-color', theme.typography.bodyColor);
        } else {
            set('--presentation-block-text-color-subtle', getContrastTextColor(subtleBackground));
        }
    } else if (theme.design.blocks.blockFillColorsType === 'custom') {
        // For custom type, use the custom colors
        if (theme.design.blocks.blockBackgroundCustomColors.length > 0) {
            theme.design.blocks.blockBackgroundCustomColors.forEach((color, idx) => {
                set(`--presentation-block-background-custom-${idx + 1}`, color);
                set(`--presentation-block-border-color-custom-${idx + 1}`, getBorderColorForBackground(color));
                if (theme.design.blocks.backgroundBlockFillType === 'none') {
                    set(`--presentation-block-text-color-custom-${idx + 1}`, theme.typography.bodyColor);
                } else {
                    set(`--presentation-block-text-color-custom-${idx + 1}`, getContrastTextColor(color));
                }
            });
            // Set the first custom color as default background
            set('--presentation-block-background', theme.design.blocks.blockBackgroundCustomColors[0]);
            set(
                '--presentation-block-border-color',
                getBorderColorForBackground(theme.design.blocks.blockBackgroundCustomColors[0])
            );
            set(
                '--presentation-block-background-custom-count',
                String(theme.design.blocks.blockBackgroundCustomColors.length)
            );
        } else {
            // Fallback to primary accent if no custom colors are defined
            set('--presentation-block-background', theme.colors.primaryAccent);
            set('--presentation-block-border-color', getBorderColorForBackground(theme.colors.primaryAccent));
            if (theme.design.blocks.backgroundBlockFillType === 'none') {
                set('--presentation-block-text-color', theme.typography.bodyColor);
            } else {
                set('--presentation-block-text-color', getContrastTextColor(theme.colors.primaryAccent));
            }
        }
    } else {
        // Fallback for any other case
        set('--presentation-block-background', theme.colors.primaryAccent);
        set('--presentation-block-border-color', getBorderColorForBackground(theme.colors.primaryAccent));

        if (theme.design.blocks.backgroundBlockFillType === 'none') {
            set('--presentation-block-text-color', theme.typography.bodyColor);
        } else {
            set('--presentation-block-text-color', getContrastTextColor(theme.colors.primaryAccent));
        }
    }

    // Block shadow
    const blockShadowMap: Record<string, string> = {
        none: 'none',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
    };
    set('--presentation-block-shadow', blockShadowMap[theme.design.blocks.shadow]);

    // Button colors
    if (theme.design.buttons.buttonColor) {
        set('--presentation-button-color', theme.design.buttons.buttonColor);
        set('--presentation-button-hover-color', getHoverColor(theme.design.buttons.buttonColor, 15));
        set('--presentation-button-text-color', getContrastTextColor(theme.design.buttons.buttonColor));
    }

    // Button shape
    const buttonRadiusMap: Record<string, string> = {
        square: '0.09375em',
        capsule: 'var(--chakra-radii-full)',
        default: '0.25em',
        rounded: '0.5em',
    };
    set('--presentation-button-radius', buttonRadiusMap[theme.design.buttons.buttonShape] || '4px');

    return {
        variables,
        backgroundStyles: {
            backgroundColor,
            ...backgroundStyles,
        }
    };
}

export default generateCSSVariablesFromTheme;
