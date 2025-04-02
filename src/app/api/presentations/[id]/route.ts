import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Presentation from '@/models/Presentation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

// Get a specific presentation
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const presentationId = params.id;

        // Validate ObjectId
        if (!ObjectId.isValid(presentationId)) {
            return NextResponse.json(
                { message: 'Invalid presentation ID' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const presentation = await Presentation.findOne({
            _id: presentationId,
            userId,
            isDeleted: false
        });

        if (!presentation) {
            return NextResponse.json(
                { message: 'Presentation not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            presentation: presentation.toJSON(),
        });
    } catch (error) {
        console.error('Get presentation error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update a presentation
export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const presentationId = params.id;
        const updateData = await req.json();

        // Connect to the database
        await connectToDatabase();

        // Find presentation with this ID that belongs to the user
        const presentation = await Presentation.findOne({
            _id: new ObjectId(presentationId),
            userId,
            isDeleted: false
        });

        if (!presentation) {
            return NextResponse.json(
                { message: 'Presentation not found' },
                { status: 404 }
            );
        }

        // Update the presentation
        Object.keys(updateData).forEach(key => {
            if (key !== '_id' && key !== 'userId' && key !== 'isDeleted') {
                presentation[key] = updateData[key];
            }
        });

        presentation.updatedAt = Date.now();
        await presentation.save();

        return NextResponse.json({
            message: 'Presentation updated successfully',
            presentation: presentation.toJSON(),
        });
    } catch (error) {
        console.error('Update presentation error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Delete a presentation (soft delete)
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const presentationId = params.id;

        // Connect to the database
        await connectToDatabase();

        // Find presentation with this ID that belongs to the user
        const presentation = await Presentation.findOne({
            _id: presentationId,
            userId,
            isDeleted: false
        });

        if (!presentation) {
            return NextResponse.json(
                { message: 'Presentation not found' },
                { status: 404 }
            );
        }

        // Soft delete the presentation
        presentation.isDeleted = true;
        presentation.deletedAt = new Date();
        await presentation.save();

        return NextResponse.json({
            message: 'Presentation moved to trash successfully',
        });
    } catch (error) {
        console.error('Delete presentation error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const { title } = await req.json();

        await connectToDatabase();

        const presentation = await Presentation.create({
            title,
            description: '',
            slides: [],
            userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return NextResponse.json({
            message: 'Presentation created successfully',
            presentation: presentation.toJSON(),
        });
    } catch (error) {
        console.error('Create presentation error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}