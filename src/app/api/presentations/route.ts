import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { generateId } from '@/utils/id';
import { getNewEditorElement } from '@/elements/registry';
import { parsePresentations, stringifyJsonField } from '@/utils/json';

// Get list of presentations for a user (lightweight version for dashboard)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Find presentations that belong to the user and are not deleted
        const presentations = await prisma.presentation.findMany({
            where: {
                userId: userId,
                isDeleted: false
            },
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                slides: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Use the utility function to parse the slides JSON in all presentations
        return NextResponse.json(parsePresentations(presentations));
    } catch (error) {
        console.error('Error fetching presentations:', error);
        return NextResponse.json(
            { error: 'Error fetching presentations' },
            { status: 500 }
        );
    }
}

// Create a new presentation
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const { title } = await request.json();

        const cellId = generateId();
        const newElement = getNewEditorElement(cellId);

        const slideId = generateId();
        const layoutId = generateId();
        const rowId = generateId();

        // Create slide structure
        const slideData = {
            id: slideId,
            layouts: [{
                id: layoutId,
                type: 'single-column',
                elements: [{
                    ...newElement,
                    cellId
                }],
                gridStructure: {
                    rows: [{
                        id: rowId,
                        cells: [{
                            id: cellId,
                            row: 0,
                            column: 0,
                        }]
                    }],
                    columns: 1,
                    columnWidths: ['100%']
                },
                style: {}
            }]
        };

        // Try to create the presentation using the helper function that avoids transactions
        const presentation = await prisma.presentation.create({
            data: {
                title,
                description: '',
                slides: stringifyJsonField([slideData]),
                userId,
            }
        });

        return NextResponse.json({
            presentation: {
                ...presentation,
                slides: [slideData]
            }
        });
    } catch (error) {
        console.error('Error creating presentation:', error);
        return NextResponse.json(
            { error: 'Error creating presentation' },
            { status: 500 }
        );
    }
}