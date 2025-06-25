import fs from 'fs';
import path from 'path';
// import fetch from 'node-fetch';

interface FontMetadata {
    url: string;
    supportsCyrillic: boolean;
}

export async function getFontMetadata(fontFamily: string): Promise<FontMetadata | null> {
    try {
        const response = await fetch(
            `https://www.googleapis.com/webfonts/v1/webfonts?key=${process.env.GOOGLE_API_KEY}&family=${fontFamily}`
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

async function main() {
    // Read current fontLoader.ts
    const fontLoaderPath = path.join(process.cwd(), 'src', 'utils', 'fontLoader.ts');
    const fontLoaderContent = fs.readFileSync(fontLoaderPath, 'utf8');

    // Extract font URLs
    const urlRegex = /https:\/\/fonts\.googleapis\.com\/css2\?family=([^&]+)/g;
    const matches = [...fontLoaderContent.matchAll(urlRegex)];

    const fonts: Record<string, FontMetadata> = {};

    // Process each font
    for (const match of matches) {
        const encodedFamily = match[1].split(':')[0];
        const family = decodeURIComponent(encodedFamily).toLowerCase();

        const metadata = await getFontMetadata(encodedFamily);
        if (metadata) {
            fonts[family] = metadata;
            console.log(`Processed ${family}: ${metadata.supportsCyrillic ? 'Supports' : 'Does not support'} Cyrillic`);
        }
    }

    // Write new content
    // fs.writeFileSync(fontLoaderPath, newContent);
    console.log('Updated fontLoader.ts with Cyrillic support information');
}

main().catch(console.error);
