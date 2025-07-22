import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const LIMIT = 3;
const attempts = new Map<string, { count: number; time: number }>();

export async function POST(req: NextRequest) {
    const { email } = await req.json();
    if (!email) {
        return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        // Do not reveal whether email exists
        return NextResponse.json({ message: 'If the account exists, a verification email has been sent' });
    }

    if (user.emailVerified || user.isVerified) {
        return NextResponse.json({ message: 'Email already verified' });
    }

    const now = Date.now();
    const entry = attempts.get(email);
    if (entry && now - entry.time < WINDOW_MS) {
        if (entry.count >= LIMIT) {
            return NextResponse.json({ message: 'Too many requests' }, { status: 429 });
        }
        entry.count += 1;
    } else {
        attempts.set(email, { count: 1, time: now });
    }

    const token = uuidv4();
    const expires = new Date(now + 24 * 60 * 60 * 1000);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            verificationToken: token,
            verificationTokenExpires: expires,
        },
    });

    try {
        await sendVerificationEmail(user.email, token);
    } catch (error) {
        console.error('Failed to send verification email:', error);
    }

    return NextResponse.json({ message: 'Verification email sent' });
}
