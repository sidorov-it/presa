import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { generateId } from '@/utils/id';
import { getNewEditorElement } from '@/utils/getNewEditorElement';
import { parsePresentation } from '@/utils/json';

// Get a specific presentation
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const presentationData = await prisma.presentation.findUnique({
            where: { id: params.id },
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
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const id = params.id;
        const data = await request.json();

        // Try to update using the helper function that avoids transactions
        const {
            id: _id,
            userId: _userId,
            ...updateData
        } = {
            ...data,
            updatedAt: new Date(),
            slides: data.slides ?? undefined,
        };

        const presentation = await prisma.presentation.update({
            where: { id },
            data: updateData,
        });

        // Use the utility function to parse the slides JSON in the response
        return NextResponse.json(parsePresentation(presentation));
    } catch (error) {
        logger.error('Error updating presentation:', error);
        return NextResponse.json({ error: 'Error updating presentation' }, { status: 500 });
    }
}

// Delete a presentation (soft delete)
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
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

export async function POST(req: NextRequest) {
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
                            ...getNewEditorElement(generateId()),
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
