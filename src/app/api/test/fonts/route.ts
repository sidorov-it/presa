import { NextResponse } from 'next/server';
// import { FONT_URLS } from '@/utils/fontLoader';

const FONT_URLS = [
    {
        name: 'Alice',
        link: 'https://fonts.googleapis.com/css2?family=Alice:wght@400&display=swap',
    },
    {
        name: 'Arimo',
        link: 'https://fonts.googleapis.com/css2?family=Arimo:wght@400;500;600;700&display=swap',
    },
    {
        name: 'Bitter',
        link: 'https://fonts.googleapis.com/css2?family=Bitter:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Brygada 1918',
        link: 'https://fonts.googleapis.com/css2?family=Brygada%201918:wght@400;500;600;700&display=swap',
    },
    {
        name: 'Comfortaa',
        link: 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&display=swap',
    },
    {
        name: 'Cormorant Garamond',
        link: 'https://fonts.googleapis.com/css2?family=Cormorant%20Garamond:wght@300;400;500;600;700&display=swap',
    },
    {
        name: 'Dela Gothic One',
        link: 'https://fonts.googleapis.com/css2?family=Dela%20Gothic%20One:wght@400&display=swap',
    },
    {
        name: 'EB Garamond',
        link: 'https://fonts.googleapis.com/css2?family=EB%20Garamond:wght@400;500;600;700;800&display=swap',
    },
    {
        name: 'Fira Mono',
        link: 'https://fonts.googleapis.com/css2?family=Fira%20Mono:wght@400;500;700&display=swap',
    },
    {
        name: 'Fira Sans',
        link: 'https://fonts.googleapis.com/css2?family=Fira%20Sans:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Geist',
        link: 'https://fonts.googleapis.com/css2?family=Geist:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Geist Mono',
        link: 'https://fonts.googleapis.com/css2?family=Geist%20Mono:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'IBM Plex Sans',
        link: 'https://fonts.googleapis.com/css2?family=IBM%20Plex%20Sans:wght@100;200;300;400;500;600;700&display=swap',
    },
    {
        name: 'Inter',
        link: 'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Libre Franklin',
        link: 'https://fonts.googleapis.com/css2?family=Libre%20Franklin:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Lora',
        link: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap',
    },
    {
        name: 'Manrope',
        link: 'https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap',
    },
    {
        name: 'Merriweather',
        link: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Montserrat',
        link: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Mulish',
        link: 'https://fonts.googleapis.com/css2?family=Mulish:wght@200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Nobile',
        link: 'https://fonts.googleapis.com/css2?family=Nobile:wght@400;500;700&display=swap',
    },
    {
        name: 'Noto Sans',
        link: 'https://fonts.googleapis.com/css2?family=Noto%20Sans:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Noto Sans HK',
        link: 'https://fonts.googleapis.com/css2?family=Noto%20Sans%20HK:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Noto Sans JP',
        link: 'https://fonts.googleapis.com/css2?family=Noto%20Sans%20JP:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Noto Sans KR',
        link: 'https://fonts.googleapis.com/css2?family=Noto%20Sans%20KR:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Noto Sans SC',
        link: 'https://fonts.googleapis.com/css2?family=Noto%20Sans%20SC:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Noto Sans TC',
        link: 'https://fonts.googleapis.com/css2?family=Noto%20Sans%20TC:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Noto Serif',
        link: 'https://fonts.googleapis.com/css2?family=Noto%20Serif:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Noto Serif HK',
        link: 'https://fonts.googleapis.com/css2?family=Noto%20Serif%20HK:wght@200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Noto Serif JP',
        link: 'https://fonts.googleapis.com/css2?family=Noto%20Serif%20JP:wght@200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Noto Serif KR',
        link: 'https://fonts.googleapis.com/css2?family=Noto%20Serif%20KR:wght@200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Noto Serif SC',
        link: 'https://fonts.googleapis.com/css2?family=Noto%20Serif%20SC:wght@200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Noto Serif TC',
        link: 'https://fonts.googleapis.com/css2?family=Noto%20Serif%20TC:wght@200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Nunito',
        link: 'https://fonts.googleapis.com/css2?family=Nunito:wght@200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Nunito Sans',
        link: 'https://fonts.googleapis.com/css2?family=Nunito%20Sans:wght@200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Open Sans',
        link: 'https://fonts.googleapis.com/css2?family=Open%20Sans:wght@300;400;500;600;700;800&display=swap',
    },
    {
        name: 'Oswald',
        link: 'https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500;600;700&display=swap',
    },
    {
        name: 'Overpass',
        link: 'https://fonts.googleapis.com/css2?family=Overpass:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Playfair Display',
        link: 'https://fonts.googleapis.com/css2?family=Playfair%20Display:wght@400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Prata',
        link: 'https://fonts.googleapis.com/css2?family=Prata:wght@400&display=swap',
    },
    {
        name: 'PT Sans',
        link: 'https://fonts.googleapis.com/css2?family=PT%20Sans:wght@400;700&display=swap',
    },
    {
        name: 'PT Sans Narrow',
        link: 'https://fonts.googleapis.com/css2?family=PT%20Sans%20Narrow:wght@400;700&display=swap',
    },
    {
        name: 'PT Serif',
        link: 'https://fonts.googleapis.com/css2?family=PT%20Serif:wght@400;700&display=swap',
    },
    {
        name: 'Raleway',
        link: 'https://fonts.googleapis.com/css2?family=Raleway:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Roboto',
        link: 'https://fonts.googleapis.com/css2?family=Roboto:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Roboto Condensed',
        link: 'https://fonts.googleapis.com/css2?family=Roboto%20Condensed:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Roboto Mono',
        link: 'https://fonts.googleapis.com/css2?family=Roboto%20Mono:wght@100;200;300;400;500;600;700&display=swap',
    },
    {
        name: 'Roboto Slab',
        link: 'https://fonts.googleapis.com/css2?family=Roboto%20Slab:wght@100;200;300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Rubik',
        link: 'https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800;900&display=swap',
    },
    {
        name: 'Unbounded',
        link: 'https://fonts.googleapis.com/css2?family=Unbounded:wght@200;300;400;500;600;700;800;900&display=swap',
    },
];

export async function getFontMetadata(fontFamily: string) {
    try {
        const response = await fetch(
            `https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyD8N_4UlhreOgwNUgfTcQhGM_lj9iq5Ygs&family=${fontFamily}`
        );
        const data = await response.json();

        if (data.items && data.items[0]) {
            const font = data.items[0];
            const supportsCyrillic = font.subsets.includes('cyrillic');

            return {
                url: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family)}:wght@${font.variants.join(';')}&display=swap`,
                supportsCyrillic,
            };
        }
    } catch (error) {
        console.error(`Error fetching metadata for ${fontFamily}:`, error);
    }

    return null;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET() {
    const result = [];

    for (let i = 0; i < FONT_URLS.length; i++) {
        console.log(`Processing font ${i + 1} of ${FONT_URLS.length}`);
        const fontFamily = FONT_URLS[i].name;
        const fontMetadata = await getFontMetadata(fontFamily);
        if (fontMetadata?.supportsCyrillic) {
            result.push(FONT_URLS[i]);
        }

        // Add 2-second delay before the next request, but not after the last one
        if (i < FONT_URLS.length - 1) {
            await delay(2000);
        }
    }

    return NextResponse.json(result);
}
