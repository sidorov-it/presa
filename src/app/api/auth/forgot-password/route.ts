import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
    // Parse the request body
        const { email } = await req.json();

        // Validate the input
        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        // Find the user
        const user = await prisma.user.findUnique({ where: { email } });

        // For security reasons, return success even if user is not found
        // This prevents enumeration attacks
        if (!user) {
            return NextResponse.json(
                { message: 'If a user with that email exists, a password reset link has been sent.' },
                { status: 200 }
            );
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        // Save token to user document
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(resetTokenExpiry);
        await prisma.user.update({ where: { id: user.id }, data: { resetPasswordToken: resetToken, resetPasswordExpires: new Date(resetTokenExpiry) } });

        // In a real application, you would send an email with a link to reset the password
        // For this example, we'll just return the token in the response
        // TODO: Replace with actual email sending in production

        return NextResponse.json(
            {
                message: 'If a user with that email exists, a password reset link has been sent.',
                // Include token in development only
                ...(process.env.NODE_ENV === 'development' && {
                    token: resetToken,
                    resetUrl: `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
                })
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}