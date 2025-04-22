/**
 * Determines whether black or white text should be used based on background color
 * @param backgroundColor - Hex color code (e.g. "#FF0000")
 * @returns "#FFFFFF" for white or "#000000" for black
 */
export default function getContrastTextColor(backgroundColor: string): string {
    // Remove # if present
    const hex = backgroundColor.replace('#', '');

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate relative luminance using sRGB
    // Based on WCAG 2.0 formula
    const sRGB = [r, g, b].map(value => {
        value = value / 255;
        if (value <= 0.03928) {
            return value / 12.92;
        } else {
            return Math.pow((value + 0.055) / 1.055, 2.4);
        }
    });

    const luminance = 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];

    // Return white for dark backgrounds, black for light backgrounds
    // Using the standard W3C threshold of 0.5
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
