import { DEFAULT_THEME } from '@/constants/defaultTheme';

/**
 * Resets all theme-related CSS variables to default values
 * and removes the dark-theme class from the body.
 * Call this function when navigating away from pages with custom themes
 * to prevent theme styles from affecting admin UI components.
 */
export const resetThemeStyles = (): void => {
    console.log('ThemeUtils: Resetting theme styles to defaults');

    // Base colors
    document.documentElement.style.setProperty('--primary-accent', DEFAULT_THEME.colors.primaryAccent);
    document.documentElement.style.setProperty('--accent-blocks-color', DEFAULT_THEME.colors.accentBlocksColor);
    document.documentElement.style.setProperty('--secondary-button-color', DEFAULT_THEME.colors.secondaryButtonColor);

    document.documentElement.style.setProperty('--shapes-color', DEFAULT_THEME.colors.shapesColor);

    document.documentElement.style.setProperty('--heading-color', DEFAULT_THEME.colors.headingColor);
    document.documentElement.style.setProperty('--text-color', DEFAULT_THEME.colors.textColor);
    document.documentElement.style.setProperty('--slide-background', DEFAULT_THEME.colors.slideBackground);

    // Set page background based on type
    // image
    if (DEFAULT_THEME.colors.pageBackground.type === 'color') {
        document.documentElement.style.setProperty(
            '--page-background-color',
            DEFAULT_THEME.colors.pageBackground.color
        );
    } else {
        document.documentElement.style.setProperty(
            '--page-background-image',
            `url(${DEFAULT_THEME.colors.pageBackground.imageUrl})`
        );
    }

    // Typography
    document.documentElement.style.setProperty(
        '--heading-font',
        `'${DEFAULT_THEME.typography.headingFont}', sans-serif`
    );
    document.documentElement.style.setProperty('--heading-weight', DEFAULT_THEME.typography.headingWeight.toString());
    document.documentElement.style.setProperty('--body-font', `'${DEFAULT_THEME.typography.bodyFont}', sans-serif`);
    document.documentElement.style.setProperty('--body-weight', DEFAULT_THEME.typography.bodyWeight.toString());

    // Slide design
    document.documentElement.style.setProperty('--slide-border-radius', DEFAULT_THEME.design.slide.borderRadius);
    document.documentElement.style.setProperty('--slide-shadow', DEFAULT_THEME.design.slide.shadow);
    // document.documentElement.style.setProperty('--slide-border', DEFAULT_THEME.design.slide.border);
    document.documentElement.style.setProperty('--slide-border-color', DEFAULT_THEME.design.slide.borderColor);

    // Block design
    document.documentElement.style.setProperty('--block-background', DEFAULT_THEME.design.blocks.backgroundColor);
    // document.documentElement.style.setProperty('--block-opacity', DEFAULT_THEME.design.blocks.opacity.toString());

    // Handle block border width with proper indentation
    let blockBorderWidth = '0';
    if (DEFAULT_THEME.design.blocks.borderWidth === 'thin') {
        blockBorderWidth = '1px';
    } else if (DEFAULT_THEME.design.blocks.borderWidth === 'medium') {
        blockBorderWidth = '2px';
    } else if (DEFAULT_THEME.design.blocks.borderWidth === 'thick') {
        blockBorderWidth = '4px';
    }
    document.documentElement.style.setProperty('--block-border-width', blockBorderWidth);

    document.documentElement.style.setProperty('--block-shadow', DEFAULT_THEME.design.blocks.shadow);

    // Button and link design
    // document.documentElement.style.setProperty('--button-color', DEFAULT_THEME.design.buttons.buttonColor);
    document.documentElement.style.setProperty('--button-shape', DEFAULT_THEME.design.buttons.buttonShape);
    // document.documentElement.style.setProperty('--link-color', DEFAULT_THEME.design.buttons.linkColor);

    // Control variables (set to light theme defaults)
    document.documentElement.style.setProperty('--control-stroke', 'rgba(0, 0, 0, 0.2)');
    document.documentElement.style.setProperty('--control-icon', 'rgba(0, 0, 0, 0.6)');
    document.documentElement.style.setProperty('--control-background', 'transparent');

    document.body.style.backgroundImage = ``;
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundAttachment = '';
};

/**
 * Clears all theme-related CSS variables from document.documentElement
 * Use this when you want to completely remove theme styling from the page
 */
export const clearAllThemeStyles = (): void => {
    console.log('ThemeUtils: Clearing all theme styles from document');

    // List of all presentation-related CSS variables that might be set
    const presentationVars = [
        '--presentation-primary-accent',
        '--presentation-secondary-accent-1',
        '--presentation-secondary-accent-2',
        '--presentation-secondary-accent-3',
        '--presentation-shapes-color',
        '--presentation-accent-blocks-color',
        '--presentation-secondary-button-color',
        '--presentation-heading-color',
        '--presentation-text-color',
        '--presentation-slide-background',
        '--presentation-page-background-color',
        '--presentation-page-background-image',
        '--presentation-page-background-size',
        '--presentation-page-background-position',
        '--presentation-page-background-repeat',
        '--presentation-page-background-attachment',
        '--presentation-heading-font',
        '--presentation-heading-weight',
        '--presentation-body-font',
        '--presentation-body-weight',
        '--presentation-heading-line-height',
        '--presentation-heading-letter-spacing',
        '--presentation-heading-capitalization',
        '--presentation-body-line-height',
        '--presentation-body-letter-spacing',
        '--presentation-body-capitalization',
        '--presentation-slide-border-radius',
        '--presentation-slide-shadow',
        '--presentation-slide-border-width',
        '--presentation-slide-border-color',
        '--presentation-slide-image-mask-image-left',
        '--presentation-slide-image-mask-image-right',
        '--presentation-slide-image-mask-image-top',
        '--presentation-block-fill-type',
        '--presentation-block-border-width',
        '--presentation-block-background',
        '--presentation-block-background-custom-type',
        '--presentation-block-background-custom-1',
        '--presentation-block-background-custom-2',
        '--presentation-block-background-custom-3',
        '--presentation-block-background-custom-count',
        '--presentation-block-shadow',
        '--presentation-button-color',
        '--presentation-button-hover-color',
        '--presentation-button-text-color',
        '--presentation-button-radius',
        '--presentation-link-color',
    ];

    // Remove all presentation variables from document.documentElement
    presentationVars.forEach(varName => {
        document.documentElement.style.removeProperty(varName);
    });

    // Clear body background styles that might be set by themes
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundAttachment = '';
    document.body.style.backgroundColor = '';
};
