import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const MIME_TYPES: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
};

export const GET = async (req: NextRequest, props: { params: Promise<{ filename: string }> }) => {
    const params = await props.params;
    const { filename } = params;
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        return new NextResponse('Not found', { status: 404 });
    }
    const filePath = path.join(UPLOAD_DIR, filename);
    try {
        const file = await fs.readFile(filePath);
        return new NextResponse(file, {
            status: 200,
            headers: {
                'Content-Type': MIME_TYPES[ext],
                'Content-Disposition': `inline; filename="${filename}"`,
            },
        });
    } catch {
        return new NextResponse('Not found', { status: 404 });
    }
};
