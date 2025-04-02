import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { ObjectId } from 'mongodb';
export async function POST(req: NextRequest) {
    try {
    // Parse the request body
        const { name, email, password } = await req.json();

        // Validate the input
        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { message: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Connect to the database
        await connectToDatabase();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            isVerified: true, // For simplicity, we're setting users as verified by default
        });

        await user.save();

        // Return success response (without sensitive data)
        return NextResponse.json(
            {
                message: 'User registered successfully',
                user: {
                    id: new ObjectId(user._id),
                    name: user.name,
                    email: user.email,
                }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}