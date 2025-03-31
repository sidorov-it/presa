import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Presentation from '@/models/Presentation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// Get all presentations for a user
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
    
    // Check for query parameters
    const { searchParams } = new URL(req.url);
    const isDeleted = searchParams.get('deleted') === 'true';
    
    // Connect to the database
    await connectToDatabase();
    
    // Find presentations for this user
    const presentations = await Presentation.find({ 
      userId, 
      isDeleted 
    }).sort({ updatedAt: -1 });
    
    return NextResponse.json({
      presentations: presentations.map(p => p.toJSON()),
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
    const presentationData = await req.json();
    
    // Connect to the database
    await connectToDatabase();
    
    // Create the presentation
    const presentation = new Presentation({
      ...presentationData,
      userId,
      slides: presentationData.slides || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    await presentation.save();
    
    return NextResponse.json(
      { 
        message: 'Presentation created successfully',
        presentation: presentation.toJSON()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create presentation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 