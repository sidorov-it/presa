import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Presentation from '@/models/Presentation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
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

        // Find the original presentation
        const originalPresentation = await Presentation.findOne({
            _id: presentationId,
            userId,
            isDeleted: false
        });

        if (!originalPresentation) {
            return NextResponse.json(
                { message: 'Presentation not found' },
                { status: 404 }
            );
        }

        // Create a deep copy of the presentation
        const presentationData = originalPresentation.toObject();
        delete presentationData._id; // Remove the original ID
        delete presentationData.createdAt;
        delete presentationData.updatedAt;

        // Create new IDs for all slides and their elements
        const newSlides = presentationData.slides.map((slide: any) => {
            const newSlideId = new ObjectId().toString();
            const newLayouts = slide.layouts.map((layout: any) => {
                const newLayoutId = new ObjectId().toString();
                const newElements = layout.elements.map((element: any) => ({
                    ...element,
                    id: new ObjectId().toString(),
                }));
                return {
                    ...layout,
                    id: newLayoutId,
                    elements: newElements,
                };
            });
            return {
                ...slide,
                id: newSlideId,
                layouts: newLayouts,
            };
        });

        // Create the new presentation with a new string ID
        const newPresentation = await Presentation.create({
            ...presentationData,
            _id: new ObjectId().toString(), // Explicitly set string ID
            title: `${presentationData.title} (Копия)`,
            slides: newSlides,
            userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return NextResponse.json({
            message: 'Presentation duplicated successfully',
            presentation: newPresentation.toJSON(),
        });
    } catch (error) {
        console.error('Duplicate presentation error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
} 