import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const POST = async (req: NextRequest) => {
    try {
        const { imageUrl } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
        }

        // Download the image
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to download image' }, { status: 400 });
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
            return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
        }

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > MAX_SIZE) {
            return NextResponse.json({ error: 'File too large' }, { status: 400 });
        }

        // Ensure uploads directory exists
        await fs.mkdir(UPLOAD_DIR, { recursive: true });

        // Generate unique filename
        const ext = contentType.split('/')[1];
        const filename = `${uuidv4()}.${ext}`;
        const filePath = path.join(UPLOAD_DIR, filename);

        // Save file
        await fs.writeFile(filePath, Buffer.from(buffer));

        const fileUrl = `/uploads/${filename}`;
        return NextResponse.json({ url: fileUrl, name: filename });
    } catch (error) {
        console.error('Error uploading external image:', error);
        return NextResponse.json(
            { error: 'Failed to process image' },
            { status: 500 }
        );
    }
}; 