import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { parsePresentation } from '@/utils/json';
import { createExportData, createSafeFilename } from '@/utils/exportImport';
import { isValidObjectId } from '@/utils/validateObjectId';

const handleRequest = async (request: NextRequest, props: { params: Promise<{ id: string }> }) => {
    try {
        const params = await props.params;
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const presentationId = params.id;

        // Validate ObjectId format
        if (!isValidObjectId(presentationId)) {
            return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
        }

        // Fetch presentation from database
        const presentation = await prisma.presentation.findUnique({
            where: { id: presentationId },
            include: { user: true },
        });

        if (!presentation || presentation.isDeleted) {
            return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
        }

        // Check if user owns the presentation
        if (presentation.user.email !== session.user.email) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse presentation data
        const parsedPresentation = parsePresentation(presentation);

        // Create export data structure
        const exportData = createExportData(parsedPresentation);

        // Create filename
        const filename = createSafeFilename(parsedPresentation.title);

        // Return JSON file as download
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        logger.error('Error exporting presentation:', error);
        return NextResponse.json({ error: 'Failed to export presentation' }, { status: 500 });
    }
};

// Export presentation as JSON
async function GETHandler(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    return handleRequest(request, { params });
}

export const GET = withLogging(GETHandler);
