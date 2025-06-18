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
        // '--presentation-shapes-color',
        '--presentation-accent-blocks-color',
        '--presentation-accent-blocks-text-color',
        // '--presentation-secondary-button-color',
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

export function getContrastingTextColor(hexColor: string): '#000000' | '#FFFFFF' {
    // Удаляем символ "#" если есть
    const hex = hexColor.replace('#', '');

    // Проверка на валидность
    if (!/^([0-9A-Fa-f]{6})$/.test(hex)) {
        throw new Error(`Invalid hex color format: ${hexColor}`);
    }

    // Преобразуем hex в R, G, B
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Вычисляем яркость по формуле для восприятия
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    // Порог для определения черного или белого текста
    return luminance > 166 ? '#000000' : '#FFFFFF';
}
