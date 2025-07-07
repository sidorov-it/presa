import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import https from 'https';
import { v4 as uuidv4 } from 'uuid';
import { IncomingMessage } from 'http';
import themes from './themes.json';
import defaultTheme from './defaultTheme.json';
import { FONT_URLS } from '@/utils/fontLoader';
import { Theme } from '@prisma/client';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Helper function to get a random font from available fonts
function getRandomFont(): string {
    const availableFonts = Object.keys(FONT_URLS);
    return availableFonts[Math.floor(Math.random() * availableFonts.length)];
}

// Helper function to get a valid font, or substitute with a random one if not available
function getValidFont(requestedFont: string): string {
    const normalizedFont = requestedFont.charAt(0).toUpperCase() + requestedFont.slice(1).toLowerCase();
    return FONT_URLS[normalizedFont] ? normalizedFont : getRandomFont();
}

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

async function transformTheme(basicTheme: any): Promise<Theme> {
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
        description: basicTheme.name || '',
        colors: {
            primaryAccent: getFirstColor(basicTheme.primaryAccent),
            primaryAccentTextColor: '#FFFFFF', // Default white text on accent
            slideBackground: basicTheme.cardColor,
            secondaryAccents: basicTheme.secondaryColors || [],
            pageBackground: {
                type: pageBackgroundImageUrl ? 'image' : 'color',
                color: basicTheme.pageBackground?.value || '#FFFFFF',
                imageUrl: pageBackgroundImageUrl,
            },
        },
        typography: {
            headingFont: getValidFont(basicTheme.headingFont || 'Inter'),
            headingWeight: 400,
            headingColor: getFirstColor(basicTheme.headingColor),
            headingLineHeight: 1.25,
            headingLetterSpacing: 0,
            headingCapitalization: 'none',
            bodyFont: getValidFont(basicTheme.bodyFont || 'Inter'),
            bodyWeight: 400,
            bodyColor: getFirstColor(basicTheme.bodyColor),
            bodyLineHeight: 1.6,
            bodyLetterSpacing: 0,
            bodyCapitalization: 'none',
        },
        design: {
            slide: {
                borderRadius: basicTheme.roundness,
                shadow: basicTheme.shadow || 'md',
                borderWidth: basicTheme.cardBorder,
                borderColor: basicTheme.cardBorderColor || '',
                opacity: basicTheme.cardTransparency,
                imageShape: basicTheme.imageShape === 'round-inverse' ? 'round_inverse' : basicTheme.imageShape,
            },
            blocks: {
                backgroundColor: basicTheme.primaryAccent,
                backgroundBlockFillType: basicTheme.blockFill,
                borderWidth: basicTheme.blockBorder,
                blockFillColorsType: basicTheme.blockFillType,
                blockBackgroundCustomColors: basicTheme.secondaryColors || [],
                shadow: basicTheme.blockShadow || 'md',
            },
            buttons: {
                buttonColor: basicTheme.primaryAccent,
                buttonShape: 'default',
                linkColor: basicTheme.primaryAccent,
            },
        },
        isDefault: true,
        isActive: true,
    };
}

export async function GET(request: NextRequest, props: { params: Promise<{ default: string }> }) {
    try {
        const params = await props.params;

        // if (params?.default === 'true') {
        const transformedTheme = await transformTheme(defaultTheme);

        transformedTheme.defaultForNewPresentations = true;
        transformedTheme.isActive = true;

        // Save to database
        await prisma.theme.create({
            data: transformedTheme,
        });

        // return NextResponse.json({ success: true, count: 1 });
        // } else {
        const transformedThemes = await Promise.all(themes.map(transformTheme));

        // Save to database
        await prisma.theme.createMany({
            data: transformedThemes,
        });
        return NextResponse.json({ success: true, count: transformedThemes.length });
        // }
    } catch (error) {
        console.error('Error importing themes:', error);
        return NextResponse.json({ error: 'Failed to import themes' }, { status: 500 });
    }
}
