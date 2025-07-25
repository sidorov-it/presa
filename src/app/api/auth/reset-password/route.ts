import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

async function POSTHandler(req: NextRequest) {
    try {
        // Parse the request body
        const { token, password } = await req.json();

        // Validate the input
        if (!token || !password) {
            return NextResponse.json({ message: 'Требуется токен и пароль' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ message: 'Пароль должен содержать не менее 8 символов' }, { status: 400 });
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

        // Hash the new password
        const hashedPassword = await hashPassword(password);

        // Update user's password and clear reset token fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });

        return NextResponse.json({ message: 'Пароль успешно сброшен' }, { status: 200 });
    } catch (error) {
        logger.error('Reset password error:', error);
        return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
export const POST = withLogging(POSTHandler);
