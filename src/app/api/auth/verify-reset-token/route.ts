import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    try {
    // Parse the request body
        const { token } = await req.json();

        // Validate the input
        if (!token) {
            return NextResponse.json(
                { message: 'Token is required' },
                { status: 400 }
            );
        }

        // Connect to the database
        await connectToDatabase();

        // Find user with this token and token not expired
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid or expired token' },
                { status: 400 }
            );
        }

        // Token is valid
        return NextResponse.json(
            { message: 'Token is valid' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Verify token error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
} 