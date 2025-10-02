import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { generateId } from '@/utils/id';
import { getNewEditorElement } from '@/utils/getNewEditorElement';
import { parsePresentation } from '@/utils/json';
import cloneDeep from 'lodash/cloneDeep';
import { applyChange, type Diff } from 'deep-diff';
import type { Prisma } from '@prisma/client';
import type { IPresentation, PresentationUpdateDiffRequest } from '@/types';

// Get a specific presentation
async function GETHandler(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const presentationData = await prisma.presentation.findUnique({
            where: { id: params.id, userId: session.user.id },
        });

        if (!presentationData) {
            return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
        }

        // Parse the presentation data (convert JSON strings to objects)
        const presentation = parsePresentation(presentationData);

        return NextResponse.json(presentation, { status: 200 });
    } catch (error) {
        logger.error('Error fetching presentation:', error);
        return NextResponse.json({ error: 'Failed to fetch presentation' }, { status: 500 });
    }
}

// Update a presentation
async function PUTHandler(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const id = params.id;
        const body = (await request.json()) as PresentationUpdateDiffRequest;

        if (!Array.isArray(body?.diff)) {
            return NextResponse.json({ error: 'Invalid diff payload' }, { status: 400 });
        }

        const presentationRecord = await prisma.presentation.findFirst({
            where: { id, userId: session.user.id, isDeleted: false },
        });

        if (!presentationRecord) {
            return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
        }

        if (body.diff.length === 0) {
            return NextResponse.json(parsePresentation(presentationRecord));
        }

        const currentPresentation = parsePresentation(presentationRecord) as unknown as IPresentation;
        const sourcePresentation = cloneDeep(currentPresentation);
        const updatedPresentation = cloneDeep(currentPresentation);

        body.diff.forEach(change => {
            applyChange(updatedPresentation, sourcePresentation, change as Diff<IPresentation>);
        });

        const backgroundSettingsUpdate =
            updatedPresentation.backgroundSettings === undefined
                ? undefined
                : { set: updatedPresentation.backgroundSettings ?? null };

        const headerFooterConfigUpdate =
            updatedPresentation.headerFooterConfig === undefined
                ? undefined
                : { set: updatedPresentation.headerFooterConfig ?? null };

        const updateData: Prisma.PresentationUpdateInput = {
            title: updatedPresentation.title,
            description: updatedPresentation.description ?? null,
            durationMinutes: updatedPresentation.durationMinutes ?? null,
            goal: updatedPresentation.goal ?? null,
            audience: updatedPresentation.audience ?? null,
            tone: updatedPresentation.tone ?? null,
            slides: updatedPresentation.slides as Prisma.InputJsonValue,
            themeId: updatedPresentation.themeId ?? null,
            backgroundSettings: backgroundSettingsUpdate,
            headerFooterConfig: headerFooterConfigUpdate,
            updatedAt: new Date(),
        };

        const presentation = await prisma.presentation.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(parsePresentation(presentation));
    } catch (error) {
        logger.error('Error updating presentation:', error);
        return NextResponse.json({ error: 'Error updating presentation' }, { status: 500 });
    }
}

// Delete a presentation (soft delete)
async function DELETEHandler(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const presentationId = params.id;

        // Find presentation with this ID that belongs to the user
        const presentation = await prisma.presentation.findFirst({
            where: {
                id: presentationId,
                userId: userId,
                isDeleted: false,
            },
        });

        if (!presentation) {
            return NextResponse.json({ message: 'Presentation not found' }, { status: 404 });
        }

        // Soft delete the presentation
        await prisma.presentation.update({
            where: { id: presentationId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });

        return NextResponse.json({
            message: 'Presentation moved to trash successfully',
        });
    } catch (error) {
        logger.error('Delete presentation error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

async function POSTHandler(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { title } = await req.json();

        // Create slide structure
        const slideData = {
            id: generateId(),
            layouts: [
                {
                    id: generateId(),
                    elements: [
                        {
                            ...getNewEditorElement(),
                            cellId: generateId(),
                        },
                    ],
                    gridStructure: {
                        rows: [
                            {
                                id: generateId(),
                                cells: [
                                    {
                                        id: generateId(),
                                        row: 0,
                                        column: 0,
                                    },
                                ],
                            },
                        ],
                        columns: 1,
                        columnWidths: ['100%'],
                    },
                    style: {},
                },
            ],
        };

        // Create presentation
        const presentation = await prisma.presentation.create({
            data: {
                title,
                description: '',
                slides: [slideData],
                userId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({
            message: 'Presentation created successfully',
            presentation: {
                ...presentation,
                slides: presentation.slides,
            },
        });
    } catch (error) {
        logger.error('Create presentation error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
export const GET = withLogging(GETHandler);
export const POST = withLogging(POSTHandler);
export const PUT = withLogging(PUTHandler);
export const DELETE = withLogging(DELETEHandler);
