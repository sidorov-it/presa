import { NextRequest, NextResponse } from 'next/server';
import themes from '../themes.json';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import https from 'https';
import { IncomingMessage } from 'http';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'backgrounds');

// Helper function to download image
async function downloadImage(url: string): Promise<string> {
    const filename = uuidv4();
    // const filePath = path.join(UPLOAD_DIR, filename);

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    return new Promise((resolve, reject) => {
        https
            .get(url, (response: typeof IncomingMessage) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download image: ${response.statusCode}`));
                    return;
                }

                const contentType = response.headers['content-type'];

                const fileExtension = contentType?.split('/')[1];
                const newFilePath = path.join(UPLOAD_DIR, `${filename}.${fileExtension}`);

                const fileStream = fsSync.createWriteStream(newFilePath);
                response.pipe(fileStream);

                fileStream.on('finish', () => {
                    resolve(`/uploads/${filename}.${fileExtension}`);
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

export const GET = async (_request: NextRequest) => {
    const filteredThemes = themes
        .filter(theme => theme.pageBackgroundImage)
        .map(theme => ({
            bgUrl: theme.pageBackgroundImage,
            themeName: theme.name,
        }));

    const mapping = [];
    for (const theme of filteredThemes) {
        if (theme.bgUrl) {
            const bgUrl = await downloadImage(theme.bgUrl);
            mapping.push({
                themeName: theme.themeName,
                bgUrl: bgUrl,
            });
        }
    }

    return NextResponse.json(mapping);
};
