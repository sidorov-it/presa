import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Presentation from '@/models/Presentation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

// Get list of presentations for a user (lightweight version for dashboard)
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
        
        // Find presentations that belong to the user and are not deleted
        // Only select necessary fields for the dashboard view
        const presentations = await Presentation.find(
            { userId, isDeleted: false },
            { 
                title: 1, 
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                // Select the count of slides without retrieving the actual slides content
                slides: { $size: "$slides" } 
            }
        ).sort({ updatedAt: -1 });
        
        // Format the response
        const formattedPresentations = presentations.map(p => p.toJSON());
        
        return NextResponse.json({
            presentations: formattedPresentations
        });
    } catch (error) {
        console.error('Get presentations error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Create a new presentation
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
        
        // Создаем ID для первого слайда
        const firstSlideId = new ObjectId().toString();
        
        // Создаем презентацию с первым слайдом
        const presentation = await Presentation.create({
            title,
            description: '',
            slides: [{
                id: firstSlideId,
                layouts: []
            }],
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