import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Get user profile
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
            },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
            },
        });
    } catch (error) {
        logger.error('Get profile error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// Update user profile (name only)
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        logger.debug('PUT /api/user/profile - Session:', session?.user ? 'Authenticated' : 'Not authenticated');

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { name } = await req.json();
        logger.debug('PUT /api/user/profile - UserId:', userId, 'New name:', name);

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ message: 'Name is required' }, { status: 400 });
        }

        // Find user and update
        logger.debug('PUT /api/user/profile - Looking up user with ID:', userId);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
            },
        });
        logger.debug('PUT /api/user/profile - User found by ID:', !!user);

        if (!user) {
            // Try alternative lookup by email as fallback
            logger.debug('PUT /api/user/profile - User not found by ID, trying email lookup');
            const userByEmail = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                },
            });
            logger.debug('PUT /api/user/profile - User found by email:', !!userByEmail);

            if (!userByEmail) {
                return NextResponse.json({ message: 'User not found' }, { status: 404 });
            }

            // Update user's name
            const updatedUser = await prisma.user.update({
                where: { id: userByEmail.id },
                data: {
                    name: name,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                },
            });
            logger.debug('PUT /api/user/profile - User updated by email lookup');

            return NextResponse.json({
                message: 'Profile updated successfully',
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    image: updatedUser.image,
                    role: updatedUser.role,
                },
            });
        }

        // Update user's name
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: name,
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
            },
        });
        logger.debug('PUT /api/user/profile - User updated successfully');

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                image: updatedUser.image,
                role: updatedUser.role,
            },
        });
    } catch (error) {
        logger.error('Update profile error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
