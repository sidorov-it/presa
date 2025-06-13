import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const POST = async (req: NextRequest) => {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.startsWith('multipart/form-data')) {
        return NextResponse.json({ error: 'Неверный тип содержимого' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const ext = file.type.split('/')[1];
    const filename = `${uuidv4()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Ensure uploads directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Save file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;
    return NextResponse.json({ url: fileUrl, name: filename });
};
