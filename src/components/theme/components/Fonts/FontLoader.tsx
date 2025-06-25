import { useEffect } from 'react';
import { Theme } from '@/types/theme';
import { getRequiredFontsFromTheme, loadFonts, unloadAllFonts } from '@/utils/fontLoader';

interface FontLoaderProps {
    theme: Theme;
}

export default function FontLoader({ theme }: FontLoaderProps) {
    useEffect(() => {
        // Get required font URLs from theme
        const fontUrls = getRequiredFontsFromTheme(theme);

        // Load the fonts
        loadFonts(fontUrls);

        // Cleanup on unmount
        return () => {
            unloadAllFonts();
        };
    }, [theme.typography.headingFont, theme.typography.bodyFont]);

    return null;
}
