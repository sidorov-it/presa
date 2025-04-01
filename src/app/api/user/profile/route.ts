import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Get user profile
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
    
        // Connect to the database
        await connectToDatabase();
    
        // Find user
        const user = await User.findById(userId).select('name email image role');
    
        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }
    
        return NextResponse.json({
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update user profile (name only)
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        console.log('PUT /api/user/profile - Session:', session?.user ? 'Authenticated' : 'Not authenticated');
    
        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }
    
        const userId = session.user.id;
        const { name } = await req.json();
        console.log('PUT /api/user/profile - UserId:', userId, 'New name:', name);
    
        if (!name || typeof name !== 'string') {
            return NextResponse.json(
                { message: 'Name is required' },
                { status: 400 }
            );
        }
    
        // Connect to the database
        await connectToDatabase();
        console.log('PUT /api/user/profile - Database connected');
    
        // Find user and update
        console.log('PUT /api/user/profile - Looking up user with ID:', userId);
        const user = await User.findOne({ _id: userId });
        console.log('PUT /api/user/profile - User found by ID:', !!user);

        if (!user) {
            // Try alternative lookup by email as fallback
            console.log('PUT /api/user/profile - User not found by ID, trying email lookup');
            const userByEmail = await User.findOne({ email: session.user.email });
            console.log('PUT /api/user/profile - User found by email:', !!userByEmail);
            
            if (!userByEmail) {
                return NextResponse.json(
                    { message: 'User not found' },
                    { status: 404 }
                );
            }
            
            // Update user's name
            userByEmail.name = name;
            await userByEmail.save();
            console.log('PUT /api/user/profile - User updated by email lookup');
            
            return NextResponse.json({
                message: 'Profile updated successfully',
                user: {
                    id: userByEmail._id.toString(),
                    name: userByEmail.name,
                    email: userByEmail.email,
                    image: userByEmail.image,
                    role: userByEmail.role
                }
            });
        }
    
        // Update user's name
        user.name = name;
        await user.save();
        console.log('PUT /api/user/profile - User updated successfully');
    
        return NextResponse.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
} 