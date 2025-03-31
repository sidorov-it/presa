import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';

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

    // Connect to the database
    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ email });
    
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
    await user.save();

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