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

    // Remove the dark-theme class from body
    document.body.classList.remove('dark-theme');
};
