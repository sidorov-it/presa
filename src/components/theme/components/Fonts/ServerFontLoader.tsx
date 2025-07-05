import { Theme } from '@/types/theme';
import { getRequiredFontsFromTheme } from '@/utils/fontLoader';

interface ServerFontLoaderProps {
    theme: Theme;
}

export default function ServerFontLoader({ theme }: ServerFontLoaderProps) {
    if (!theme) return null;

    // Get required font URLs from theme
    const fontUrls = getRequiredFontsFromTheme(theme);

    if (fontUrls.length === 0) return null;

    return (
        <>
            {fontUrls.map((url, index) => (
                <link
                    key={index}
                    href={url}
                    rel="stylesheet"
                    crossOrigin="anonymous"
                />
            ))}
        </>
    );
} 