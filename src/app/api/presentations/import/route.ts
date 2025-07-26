import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { ExportPresentationData } from '@/types';
import { validateImportData, regenerateIds, isVersionSupported } from '@/utils/exportImport';

const handleRequest = async (request: NextRequest) => {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Parse the request body
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Check file type
        if (!file.name.endsWith('.json')) {
            return NextResponse.json({ error: 'Invalid file type. Only JSON files are supported.' }, { status: 400 });
        }

        // Read file content
        const fileContent = await file.text();
        let importData: ExportPresentationData;

        try {
            importData = JSON.parse(fileContent);
        } catch (error) {
            return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
        }

        // Validate import data structure
        if (!validateImportData(importData)) {
            return NextResponse.json({ error: 'Invalid presentation data structure' }, { status: 400 });
        }

        // Check version compatibility
        if (!isVersionSupported(importData.version)) {
            return NextResponse.json({ error: `Unsupported version: ${importData.version}` }, { status: 400 });
        }

        // Generate new IDs for slides and all nested elements
        const slidesWithNewIds = regenerateIds(importData.presentation.slides);

        // Create presentation in database
        const presentation = await prisma.presentation.create({
            data: {
                title: `${importData.presentation.title} (Imported)`,
                description: importData.presentation.description || '',
                slides: slidesWithNewIds,
                themeId: importData.presentation.themeId,
                backgroundSettings: importData.presentation.backgroundSettings,
                durationMinutes: importData.presentation.durationMinutes,
                goal: importData.presentation.goal,
                audience: importData.presentation.audience,
                tone: importData.presentation.tone,
                userId,
            },
        });

        return NextResponse.json({
            message: 'Presentation imported successfully',
            presentation: {
                id: presentation.id,
                title: presentation.title,
                description: presentation.description,
                createdAt: presentation.createdAt,
                updatedAt: presentation.updatedAt,
            },
        });
    } catch (error) {
        logger.error('Error importing presentation:', error);
        return NextResponse.json({ error: 'Failed to import presentation' }, { status: 500 });
    }
};

// Import presentation from JSON
async function POSTHandler(request: NextRequest) {
    return handleRequest(request);
}

export const POST = withLogging(POSTHandler);
