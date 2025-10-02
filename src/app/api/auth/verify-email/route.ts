import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
        return NextResponse.json({ message: 'Token required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
        where: {
            verificationToken: token,
            verificationTokenExpires: {
                gt: new Date(),
            },
        },
    });

    if (!user) {
        return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            emailVerified: new Date(),
            verificationToken: null,
            verificationTokenExpires: null,
        },
    });

    return NextResponse.json({ message: 'Email verified' });
}
