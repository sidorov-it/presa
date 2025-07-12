import { Theme } from '@/types/theme';

// Map of font family names (lowercase) to their CDN URLs
export const FONT_URLS: Record<string, string> = {
    Alice: 'https://fonts.googleapis.com/css2?family=Alice:wght@400&display=swap',
    Arimo: 'https://fonts.googleapis.com/css2?family=Arimo:wght@400;500;600;700&display=swap',
    Bitter: 'https://fonts.googleapis.com/css2?family=Bitter:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'Brygada 1918': 'https://fonts.googleapis.com/css2?family=Brygada%201918:wght@400;500;600;700&display=swap',
    Comfortaa: 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&display=swap',
    'Cormorant Garamond':
        'https://fonts.googleapis.com/css2?family=Cormorant%20Garamond:wght@300;400;500;600;700&display=swap',
    'Dela Gothic One': 'https://fonts.googleapis.com/css2?family=Dela%20Gothic%20One:wght@400&display=swap',
    'EB Garamond': 'https://fonts.googleapis.com/css2?family=EB%20Garamond:wght@400;500;600;700;800&display=swap',
    'Fira Mono': 'https://fonts.googleapis.com/css2?family=Fira%20Mono:wght@400;500;700&display=swap',
    'Fira Sans':
        'https://fonts.googleapis.com/css2?family=Fira%20Sans:wght@100;200;300;400;500;600;700;800;900&display=swap',
    Geist: 'https://fonts.googleapis.com/css2?family=Geist:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'Geist Mono':
        'https://fonts.googleapis.com/css2?family=Geist%20Mono:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'IBM Plex Sans':
        'https://fonts.googleapis.com/css2?family=IBM%20Plex%20Sans:wght@100;200;300;400;500;600;700&display=swap',
    Inter: 'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'Libre Franklin':
        'https://fonts.googleapis.com/css2?family=Libre%20Franklin:wght@100;200;300;400;500;600;700;800;900&display=swap',
    Lora: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap',
    Manrope: 'https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap',
    Merriweather: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;500;600;700;800;900&display=swap',
    Montserrat:
        'https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap',
    Mulish: 'https://fonts.googleapis.com/css2?family=Mulish:wght@200;300;400;500;600;700;800;900&display=swap',
    Nobile: 'https://fonts.googleapis.com/css2?family=Nobile:wght@400;500;700&display=swap',
    'Noto Sans':
        'https://fonts.googleapis.com/css2?family=Noto%20Sans:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'Noto Sans HK':
        'https://fonts.googleapis.com/css2?family=Noto%20Sans%20HK:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'Noto Sans JP':
        'https://fonts.googleapis.com/css2?family=Noto%20Sans%20JP:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'Noto Sans KR':
        'https://fonts.googleapis.com/css2?family=Noto%20Sans%20KR:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'Noto Sans SC':
        'https://fonts.googleapis.com/css2?family=Noto%20Sans%20SC:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'Noto Sans TC':
        'https://fonts.googleapis.com/css2?family=Noto%20Sans%20TC:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'Noto Serif':
        'https://fonts.googleapis.com/css2?family=Noto%20Serif:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'Noto Serif HK':
        'https://fonts.googleapis.com/css2?family=Noto%20Serif%20HK:wght@200;300;400;500;600;700;800;900&display=swap',
    'Noto Serif JP':
        'https://fonts.googleapis.com/css2?family=Noto%20Serif%20JP:wght@200;300;400;500;600;700;800;900&display=swap',
    'Noto Serif KR':
        'https://fonts.googleapis.com/css2?family=Noto%20Serif%20KR:wght@200;300;400;500;600;700;800;900&display=swap',
    'Noto Serif SC':
        'https://fonts.googleapis.com/css2?family=Noto%20Serif%20SC:wght@200;300;400;500;600;700;800;900&display=swap',
    'Noto Serif TC':
        'https://fonts.googleapis.com/css2?family=Noto%20Serif%20TC:wght@200;300;400;500;600;700;800;900&display=swap',
    Nunito: 'https://fonts.googleapis.com/css2?family=Nunito:wght@200;300;400;500;600;700;800;900&display=swap',
    'Nunito Sans':
        'https://fonts.googleapis.com/css2?family=Nunito%20Sans:wght@200;300;400;500;600;700;800;900&display=swap',
    'Open Sans': 'https://fonts.googleapis.com/css2?family=Open%20Sans:wght@300;400;500;600;700;800&display=swap',
    Oswald: 'https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&display=swap',
    Overpass: 'https://fonts.googleapis.com/css2?family=Overpass:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'Playfair Display':
        'https://fonts.googleapis.com/css2?family=Playfair%20Display:wght@400;500;600;700;800;900&display=swap',
    Prata: 'https://fonts.googleapis.com/css2?family=Prata:wght@400&display=swap',
    'PT Sans': 'https://fonts.googleapis.com/css2?family=PT%20Sans:wght@400;700&display=swap',
    'PT Sans Narrow': 'https://fonts.googleapis.com/css2?family=PT%20Sans%20Narrow:wght@400;700&display=swap',
    'PT Serif': 'https://fonts.googleapis.com/css2?family=PT%20Serif:wght@400;700&display=swap',
    Raleway: 'https://fonts.googleapis.com/css2?family=Raleway:wght@100;200;300;400;500;600;700;800;900&display=swap',
    Roboto: 'https://fonts.googleapis.com/css2?family=Roboto:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'Roboto Condensed':
        'https://fonts.googleapis.com/css2?family=Roboto%20Condensed:wght@100;200;300;400;500;600;700;800;900&display=swap',
    'Roboto Mono':
        'https://fonts.googleapis.com/css2?family=Roboto%20Mono:wght@100;200;300;400;500;600;700&display=swap',
    'Roboto Slab':
        'https://fonts.googleapis.com/css2?family=Roboto%20Slab:wght@100;200;300;400;500;600;700;800;900&display=swap',
    Rubik: 'https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800;900&display=swap',
    Unbounded: 'https://fonts.googleapis.com/css2?family=Unbounded:wght@200;300;400;500;600;700;800;900&display=swap',
};

// Keep track of loaded fonts to avoid duplicate loading
const loadedFonts = new Set<string>();

// Загружает шрифты и вставляет @font-face в указанный контейнер
const loadedFontsByContainer = new WeakMap<HTMLElement, Set<string>>();

export async function loadFontsInContainer(fontUrls: string[], container: HTMLElement): Promise<void> {
    if (!container) return;
    let loaded = loadedFontsByContainer.get(container);
    if (!loaded) {
        loaded = new Set();
        loadedFontsByContainer.set(container, loaded);
    }
    for (const url of fontUrls) {
        if (loaded.has(url)) continue;
        try {
            const css = await fetch(url).then(r => r.text());
            // Извлекаем все @font-face
            const fontFaceBlocks = css.match(/@font-face\s*{[^}]+}/g);
            if (fontFaceBlocks) {
                const style = document.createElement('style');
                style.setAttribute('data-font-loader', url);
                style.textContent = fontFaceBlocks.join('\n');
                container.appendChild(style);
            }
            loaded.add(url);
        } catch (e) {
            // fail silently
        }
    }
}

export function unloadFontsFromContainer(container: HTMLElement): void {
    if (!container) return;
    container.querySelectorAll('style[data-font-loader]').forEach(el => el.remove());
    loadedFontsByContainer.delete(container);
}

export function getRequiredFontsFromTheme(theme: Theme): string[] {
    const fonts = new Set<string>();

    // Add heading font
    if (theme.typography.headingFont) {
        const headingFont = theme.typography.headingFont;
        const url = FONT_URLS[headingFont];
        if (url) fonts.add(url);
    }

    // Add body font
    if (theme.typography.bodyFont) {
        const bodyFont = theme.typography.bodyFont;
        const url = FONT_URLS[bodyFont];
        if (url) fonts.add(url);
    }

    return Array.from(fonts);
}

export function loadFonts(fontUrls: string[], targetContainer?: HTMLElement): void {
    fontUrls.forEach(url => {
        if (loadedFonts.has(url)) return;

        const link = document.createElement('link');
        link.href = url;
        link.rel = 'stylesheet';
        link.crossOrigin = 'anonymous';
        (targetContainer || document.head).appendChild(link);
        loadedFonts.add(url);
    });
}

export function unloadAllFonts(): void {
    document.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach(link => {
        if ((link as HTMLLinkElement).href === 'https://fonts.googleapis.com/') {
            return;
        }
        link.remove();
    });
    loadedFonts.clear();
}

// Export font options for the theme editor
export const FONT_OPTIONS = Object.entries(FONT_URLS).map(([value, _]) => ({
    value,
    label: value
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
}));
