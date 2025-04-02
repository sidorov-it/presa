import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Presentation from '@/models/Presentation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

// Get deleted presentations
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        await connectToDatabase();

        // Find deleted presentations that belong to the user
        const presentations = await Presentation.find(
            { userId, isDeleted: true },
            {
                title: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                deletedAt: 1,
                slides: { $size: "$slides" }
            }
        ).sort({ deletedAt: -1 });

        return NextResponse.json({
            presentations: presentations.map(p => p.toJSON())
        });
    } catch (error) {
        console.error('Get deleted presentations error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Restore a presentation
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const { id } = await req.json();

        if (!id || !ObjectId.isValid(id)) {
            return NextResponse.json(
                { message: 'Invalid presentation ID' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Find and restore the presentation
        const presentation = await Presentation.findOne({
            _id: id,
            userId,
            isDeleted: true
        });

        if (!presentation) {
            return NextResponse.json(
                { message: 'Presentation not found' },
                { status: 404 }
            );
        }

        presentation.isDeleted = false;
        presentation.deletedAt = undefined;
        await presentation.save();

        return NextResponse.json({
            message: 'Presentation restored successfully',
            presentation: presentation.toJSON()
        });
    } catch (error) {
        console.error('Restore presentation error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Permanently delete a presentation
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id || !ObjectId.isValid(id)) {
            return NextResponse.json(
                { message: 'Invalid presentation ID' },
                { status: 400 }
            );
        }

        const userId = session.user.id;

        await connectToDatabase();

        // Find and permanently delete the presentation
        const result = await Presentation.deleteOne({
            _id: id,
            userId,
            isDeleted: true
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { message: 'Presentation not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Presentation permanently deleted'
        });
    } catch (error) {
        console.error('Permanent delete presentation error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}