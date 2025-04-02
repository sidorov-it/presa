import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { comparePassword, hashPassword } from '@/lib/auth';

// Change user password
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        console.log('PUT /api/user/password - Session:', session?.user ? 'Authenticated' : 'Not authenticated');

        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const { currentPassword, newPassword } = await req.json();
        console.log('PUT /api/user/password - UserId:', userId, 'Password change request received');

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { message: 'Current password and new password are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { message: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Find user
        console.log('PUT /api/user/password - Looking up user with ID:', userId);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        console.log('PUT /api/user/password - User found by ID:', !!user);

        if (!user) {
            // Try alternative lookup by email as fallback
            console.log('PUT /api/user/password - User not found by ID, trying email lookup');
            const userByEmail = await prisma.user.findUnique({ where: { email: session.user.email } });
            console.log('PUT /api/user/password - User found by email:', !!userByEmail);

            if (!userByEmail) {
                return NextResponse.json(
                    { message: 'User not found' },
                    { status: 404 }
                );
            }

            // Verify current password
            const isPasswordValid = await comparePassword(currentPassword, userByEmail.password);
            console.log('PUT /api/user/password - Password valid:', isPasswordValid);

            if (!isPasswordValid) {
                return NextResponse.json(
                    { message: 'Current password is incorrect' },
                    { status: 400 }
                );
            }

            // Update password
            userByEmail.password = newPassword;
            await prisma.user.update({ where: { id: userByEmail.id }, data: { password: newPassword } });
            console.log('PUT /api/user/password - Password updated by email lookup');

            return NextResponse.json({
                message: 'Password changed successfully'
            });
        }

        // Verify current password
        const isPasswordValid = await comparePassword(currentPassword, user.password);
        console.log('PUT /api/user/password - Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            return NextResponse.json(
                { message: 'Current password is incorrect' },
                { status: 400 }
            );
        }

        // Update password
        user.password = await hashPassword(newPassword);
        await prisma.user.update({ where: { id: user.id }, data: { password: newPassword } });
        console.log('PUT /api/user/password - Password updated successfully');

        return NextResponse.json({
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}