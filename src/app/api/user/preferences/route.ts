import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Get user preferences
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        console.log('GET /api/user/preferences - Session:', session?.user ? 'Authenticated' : 'Not authenticated');
    
        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }
    
        const userId = session.user.id;
        console.log('GET /api/user/preferences - UserId:', userId);
    
        // Connect to the database
        await connectToDatabase();
    
        // Find user
        console.log('GET /api/user/preferences - Looking up user with ID:', userId);
        const user = await User.findOne({ _id: userId }).select('emailPreferences');
        console.log('GET /api/user/preferences - User found:', !!user, 'Email preferences:', user?.emailPreferences);
    
        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }
    
        return NextResponse.json({
            preferences: {
                emailPreferences: user.emailPreferences || { updates: true }
            }
        });
    } catch (error) {
        console.error('Get preferences error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update user preferences
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        console.log('PUT /api/user/preferences - Session:', session?.user ? 'Authenticated' : 'Not authenticated');
    
        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }
    
        const userId = session.user.id;
        const { emailUpdates } = await req.json();
        console.log('PUT /api/user/preferences - UserId:', userId, 'Email updates:', emailUpdates);
    
        if (typeof emailUpdates !== 'boolean') {
            return NextResponse.json(
                { message: 'Email updates preference must be a boolean' },
                { status: 400 }
            );
        }
    
        // Connect to the database
        await connectToDatabase();
    
        // Find user and update
        console.log('PUT /api/user/preferences - Looking up user with ID:', userId);
        
        // Use findOneAndUpdate with $set operator for updating nested fields
        const result = await User.findOneAndUpdate(
            { _id: userId },
            { $set: { 'emailPreferences.updates': emailUpdates } },
            { new: true, runValidators: true }
        );
        
        console.log('PUT /api/user/preferences - Update result:', !!result, 'New preferences:', result?.emailPreferences);
        
        if (!result) {
            console.log('PUT /api/user/preferences - User not found, trying email lookup');
            // Try by email as fallback
            const emailResult = await User.findOneAndUpdate(
                { email: session.user.email },
                { $set: { 'emailPreferences.updates': emailUpdates } },
                { new: true, runValidators: true }
            );
            
            console.log('PUT /api/user/preferences - Email lookup result:', !!emailResult);
            
            if (!emailResult) {
                return NextResponse.json(
                    { message: 'User not found' },
                    { status: 404 }
                );
            }
            
            console.log('PUT /api/user/preferences - Updated by email lookup, new preferences:', emailResult.emailPreferences);
        }
    
        return NextResponse.json({
            message: 'Preferences updated successfully'
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
} 