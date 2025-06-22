import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        // Parse the request body
        const { token } = await req.json();

        // Validate the input
        if (!token) {
            return NextResponse.json({ message: 'Необходим токен' }, { status: 400 });
        }

        // Find user with this token and token not expired
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            return NextResponse.json({ message: 'Недействительный или просроченный токен' }, { status: 400 });
        }

        // Token is valid
        return NextResponse.json({ message: 'Токен действителен' }, { status: 200 });
    } catch (error) {
        logger.error('Verify token error:', error);
        return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
