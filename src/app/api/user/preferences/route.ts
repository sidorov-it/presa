import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Get user preferences
export async function GET() {
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

        // Find user
        console.log('GET /api/user/preferences - Looking up user with ID:', userId);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { emailPreferences: true }
        });
        console.log('GET /api/user/preferences - User found:', !!user, 'Email preferences:', user?.emailPreferences);

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            emailUpdates: user.emailPreferences?.emailUpdates
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
        console.log('PUT /api/user/preferences - UserId:', userId);

        const emailUpdates = await req.json();
        console.log('PUT /api/user/preferences - New preferences:', emailUpdates);

        if (!emailUpdates || typeof emailUpdates !== 'object') {
            return NextResponse.json(
                { message: 'Valid email preferences are required' },
                { status: 400 }
            );
        }

        // Update user preferences
        console.log('PUT /api/user/preferences - Updating user with ID:', userId);
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                emailPreferences: emailUpdates
            },
            select: { emailPreferences: true }
        });
        console.log('PUT /api/user/preferences - User updated, new preferences:', updatedUser.emailPreferences);

        return NextResponse.json({
            message: 'Preferences updated successfully',
            preferences: {
                emailPreferences: updatedUser.emailPreferences
            }
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}