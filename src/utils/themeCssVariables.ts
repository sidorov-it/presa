import { Theme } from '@/types/theme';
import { BackgroundSettings } from '@/types';
import getContrastTextColor from './getContrastTextColor';
import getHoverColor from './getHoverColor';
import { getBorderColorForBackground } from './themeUtils';

/**
 * Convert theme settings to a style object with CSS variables.
 */
export function themeToCSSVariables(theme: Theme, backgroundSettings?: BackgroundSettings): React.CSSProperties {
    const style: Record<string, string> = {};
    const set = (prop: string, value: string | number | undefined) => {
        if (value === undefined) return;
        style[prop] = String(value);
    };

    // Base colors
    set('--presentation-primary-accent', theme.colors.primaryAccent);
    set('--presentation-accent-blocks-color', theme.colors.primaryAccent);

    // Text colors
    set('--presentation-heading-color', theme.typography.headingColor);
    set('--presentation-text-color', theme.typography.bodyColor);
    set('--presentation-slide-background', theme.colors.slideBackground);

    // Page background
    if (theme.colors.pageBackground || backgroundSettings?.backgroundColor) {
        if (backgroundSettings?.backgroundColor) {
            set('--presentation-page-background-color', backgroundSettings.backgroundColor);
        } else if (theme.colors.pageBackground.color) {
            set('--presentation-page-background-color', theme.colors.pageBackground.color);
        } else {
            set('--presentation-page-background-color', '#f9fafb');
        }

        if (theme.colors.pageBackground.imageUrl || backgroundSettings?.backgroundImage) {
            let imageUrl: string | undefined;
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
            }
        }
    } else {
        set('--presentation-page-background-color', '#f9fafb');
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
    set('--font-size', 'calc(0.875 * var(--card-font-scale, 1) * var(--editor-font-size, 1rem) * var(--zoom-level, 1) * var(--viewport-scale-factor, 1.125))');
    set('--media-scale', 'min(1, var(--card-font-scale, 1))');

    // Slide design
    set('--presentation-slide-border-radius', theme.design.slide.borderRadius);
    set('--presentation-slide-opacity', theme.design.slide.opacity);

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

    const borderWidthMap: Record<string, string> = {
        none: '0px',
        thin: '3px',
        medium: '4px',
        thick: '5px',
    };
    set('--presentation-slide-border-width', borderWidthMap[theme.design.slide.borderWidth] || '0px');
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
    if (theme.design.blocks.backgroundBlockFillType === 'fill') {
        set('--presentation-block-background-opacity', '1');
    } else if (theme.design.blocks.backgroundBlockFillType === 'semi') {
        set('--presentation-block-background-opacity', '0.5');
    } else {
        set('--presentation-block-background-opacity', '0');
    }

    set('--presentation-block-border-width', borderWidthMap[theme.design.blocks.borderWidth] || '0px');

    // Set the block fill colors type
    set('--presentation-block-background-custom-type', theme.design.blocks.blockFillColorsType);

    if (theme.design.blocks.blockFillColorsType === 'primary') {
        // For primary type, use the primary accent color
        set('--presentation-block-background', theme.colors.primaryAccent);
        set('--presentation-block-border-color', getBorderColorForBackground(theme.colors.primaryAccent));
        set('--presentation-block-text-color', getContrastTextColor(theme.colors.primaryAccent));
    } else if (theme.design.blocks.blockFillColorsType === 'custom') {
        // For custom type, use the custom colors
        if (theme.design.blocks.blockBackgroundCustomColors.length > 0) {
            theme.design.blocks.blockBackgroundCustomColors.forEach((color, idx) => {
                set(`--presentation-block-background-custom-${idx + 1}`, color);
                set(`--presentation-block-border-color-custom-${idx + 1}`, getBorderColorForBackground(color));
                set(`--presentation-block-text-color-custom-${idx + 1}`, getContrastTextColor(color));
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
        }
    } else {
        // Fallback for any other case
        set('--presentation-block-background', theme.colors.primaryAccent);
        set('--presentation-block-border-color', getBorderColorForBackground(theme.colors.primaryAccent));
    }

    const blockShadowMap: Record<string, string> = {
        none: 'none',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.2)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
    };
    set('--presentation-block-shadow', blockShadowMap[theme.design.blocks.shadow]);

    if (theme.design.buttons.buttonColor) {
        set('--presentation-button-color', theme.design.buttons.buttonColor);
        set('--presentation-button-hover-color', getHoverColor(theme.design.buttons.buttonColor, 15));
        set('--presentation-button-text-color', getContrastTextColor(theme.design.buttons.buttonColor));
    }

    const buttonRadiusMap: Record<string, string> = {
        square: '1.5px',
        capsule: 'var(--chakra-radii-full)',
        default: '4px',
        rounded: '8px',
    };
    set('--presentation-button-radius', buttonRadiusMap[theme.design.buttons.buttonShape] || '4px');
    set('--presentation-link-color', theme.design.buttons.linkColor || theme.colors.primaryAccent);

    return style as React.CSSProperties;
}

export default themeToCSSVariables;
