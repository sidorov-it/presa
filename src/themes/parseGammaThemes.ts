/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
import { IncomingMessage } from 'http';

// Since we can't import types in CommonJS, we'll define them inline
type ThemeDesignShadow = 'none' | 'sm' | 'md';
type ThemeDesignBorderWidth = 'none' | 'thin' | 'medium' | 'thick';
type ThemeDesignButtonShape = 'square' | 'capsule' | 'default' | 'rounded';
type ThemeDesignBackgroundBlockFillType = 'fill' | 'semi' | 'none';
type ThemeDesignBlockFillColorsType = 'subtle' | 'primary' | 'custom';
type ThemeDesignImageShape = 'default' | 'fade' | 'diagonal' | 'round' | 'round-inverse' | 'wiggle';

interface BasicTheme {
    name: string;
    primaryAccent: string;
    secondaryColors?: string[];
    headingColor: string;
    bodyColor: string;
    cardColor: string;
    pageBackground?: {
        value: string;
    };
    pageBackgroundImage?: string;
    roundness: string;
    shadow: string;
    cardBorder: string;
    cardBorderColor?: string;
    cardTransparency: number;
    imageShape: string;
    blockFillType: string;
    blockFill: string;
    blockBorder: string;
    blockShadow: string;
}

interface Theme {
    name: string;
    description?: string;
    logo?: string;
    colors: {
        primaryAccent: string;
        primaryAccentTextColor: '#000000' | '#FFFFFF';
        slideBackground: string;
        pageBackground: {
            type: 'color' | 'image';
            color: string;
            imageUrl: string;
        };
    };
    typography: {
        headingFont: string;
        headingWeight: number;
        headingColor: string;
        headingLineHeight: number;
        headingLetterSpacing: number;
        headingCapitalization: 'none' | 'uppercase';
        bodyFont: string;
        bodyWeight: number;
        bodyColor: string;
        bodyLineHeight: number;
        bodyLetterSpacing: number;
        bodyCapitalization: 'none' | 'uppercase';
    };
    design: {
        slide: {
            borderRadius: string;
            shadow: ThemeDesignShadow;
            borderWidth: ThemeDesignBorderWidth;
            borderColor: string;
            opacity: number;
            imageShape: ThemeDesignImageShape | null;
        };
        blocks: {
            backgroundColor: string;
            backgroundBlockFillType: ThemeDesignBackgroundBlockFillType;
            borderWidth: ThemeDesignBorderWidth;
            blockFillColorsType: ThemeDesignBlockFillColorsType;
            blockBackgroundCustomColors: string[];
            shadow: ThemeDesignShadow;
        };
        buttons: {
            buttonColor: string;
            buttonShape: ThemeDesignButtonShape;
            linkColor: string;
        };
    };
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Helper function to get first color from gradient
function getFirstColor(colorString: string): string {
    // If it's a gradient, extract the first color
    const match = colorString.match(/#[0-9A-Fa-f]{6}/);
    if (match) {
        return match[0];
    }
    return colorString;
}

// Helper function to download image
async function downloadImage(url: string): Promise<string> {
    const filename = `${uuidv4()}.${url.split('.').pop()}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    return new Promise((resolve, reject) => {
        https
            .get(url, (response: typeof IncomingMessage) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download image: ${response.statusCode}`));
                    return;
                }

                const fileStream = fsSync.createWriteStream(filePath);
                response.pipe(fileStream);

                fileStream.on('finish', () => {
                    resolve(`/uploads/${filename}`);
                });

                fileStream.on('error', (error: Error) => {
                    reject(error);
                });
            })
            .on('error', (error: Error) => {
                reject(error);
            });
    });
}

async function transformTheme(basicTheme: BasicTheme): Promise<Omit<Theme, 'id'>> {
    // Handle background image if exists
    let pageBackgroundImageUrl = '';
    if (basicTheme.pageBackgroundImage) {
        try {
            pageBackgroundImageUrl = await downloadImage(basicTheme.pageBackgroundImage);
        } catch (error) {
            console.error(`Failed to download image for theme ${basicTheme.name}:`, error);
        }
    }

    return {
        name: basicTheme.name,
        description: `Theme imported from Gamma: ${basicTheme.name}`,
        colors: {
            primaryAccent: getFirstColor(basicTheme.primaryAccent),
            primaryAccentTextColor: '#FFFFFF', // Default white text on accent
            slideBackground: basicTheme.cardColor,
            pageBackground: {
                type: pageBackgroundImageUrl ? 'image' : 'color',
                color: basicTheme.pageBackground?.value || '#FFFFFF',
                imageUrl: pageBackgroundImageUrl,
            },
        },
        typography: {
            headingFont: 'inter',
            headingWeight: 400,
            headingColor: getFirstColor(basicTheme.headingColor),
            headingLineHeight: 1.25,
            headingLetterSpacing: 0,
            headingCapitalization: 'none',
            bodyFont: 'inter',
            bodyWeight: 400,
            bodyColor: getFirstColor(basicTheme.bodyColor),
            bodyLineHeight: 1.25,
            bodyLetterSpacing: 0,
            bodyCapitalization: 'none',
        },
        design: {
            slide: {
                borderRadius: basicTheme.roundness,
                shadow: basicTheme.shadow as ThemeDesignShadow,
                borderWidth: basicTheme.cardBorder as ThemeDesignBorderWidth,
                borderColor: basicTheme.cardBorderColor || '',
                opacity: basicTheme.cardTransparency,
                imageShape: basicTheme.imageShape as ThemeDesignImageShape,
            },
            blocks: {
                backgroundColor: basicTheme.primaryAccent,
                backgroundBlockFillType: basicTheme.blockFill as ThemeDesignBackgroundBlockFillType,
                borderWidth: basicTheme.blockBorder as ThemeDesignBorderWidth,
                blockFillColorsType: basicTheme.blockFillType as ThemeDesignBlockFillColorsType,
                blockBackgroundCustomColors: basicTheme.secondaryColors || [],
                shadow: basicTheme.blockShadow as ThemeDesignShadow,
            },
            buttons: {
                buttonColor: basicTheme.primaryAccent,
                buttonShape: 'default' as ThemeDesignButtonShape,
                linkColor: basicTheme.primaryAccent,
            },
        },
        isDefault: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

async function main() {
    try {
        // Read themes from JSON file
        const themesJson = await fs.readFile(path.join(process.cwd(), 'src/app/api/test/themes.json'), 'utf-8');
        const themes = JSON.parse(themesJson);

        // Transform each theme
        const transformedThemes = await Promise.all(themes.map(transformTheme));

        // Write transformed themes to a new file
        await fs.writeFile(
            path.join(process.cwd(), 'src/themes/transformed-themes.json'),
            JSON.stringify(transformedThemes, null, 2)
        );

        console.log('Themes transformed successfully!');
    } catch (error) {
        console.error('Error transforming themes:', error);
    }
}

main();
