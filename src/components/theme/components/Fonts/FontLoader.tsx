import { useEffect } from 'react';
import { Theme } from '@/types/theme';
import { FONT_URLS, getRequiredFontsFromTheme, loadFonts, unloadAllFonts } from '@/utils/fontLoader';

interface FontLoaderProps {
    theme: Theme;
}

export default function FontLoader({ theme, container }: FontLoaderProps) {
    useEffect(() => {
        if (!theme) return;

        // Get required font URLs from theme
        const fontUrls = getRequiredFontsFromTheme(theme);

        // Load the fonts
        loadFonts(fontUrls);

        const style = document.createElement('style');
        style.textContent = `{
@font-face {
    font-family: '${theme.typography.headingFont}';
    src: url('${FONT_URLS[theme.typography.headingFont]}') format('woff2');
}

@font-face {
    font-family: '${theme.typography.bodyFont}';
    src: url('${FONT_URLS[theme.typography.bodyFont]}') format('woff2');
}
                }`;

        document.body.appendChild(style);

        // Cleanup on unmount
        // return () => {
        //     unloadAllFonts();
        // };
    }, [theme, theme?.typography?.headingFont, theme?.typography?.bodyFont]);

    return null;
}
