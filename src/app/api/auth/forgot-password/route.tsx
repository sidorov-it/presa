import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/server/email';
import { PasswordResetEmail } from '@/emails/PasswordResetEmail';
import { render, pretty } from '@react-email/render';

async function POSTHandler(req: NextRequest) {
    try {
        // Parse the request body
        const { email } = await req.json();

        // Validate the input
        if (!email) {
            return NextResponse.json({ message: 'Требуется указать email' }, { status: 400 });
        }

        // Find the user
        const user = await prisma.user.findUnique({ where: { email } });

        // For security reasons, return success even if user is not found
        // This prevents enumeration attacks
        if (!user) {
            return NextResponse.json(
                { message: 'Если пользователь с таким email существует, ссылка для сброса пароля была отправлена.' },
                { status: 200 }
            );
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        // Save token to user document
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(resetTokenExpiry);
        await prisma.user.update({
            where: { id: user.id },
            data: { resetPasswordToken: resetToken, resetPasswordExpires: new Date(resetTokenExpiry) },
        });

        const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

        try {
            const html = await pretty(await render(<PasswordResetEmail resetUrl={resetUrl} />));
            await sendEmail({
                to: user.email,
                subject: 'Сброс пароля',
                text: `Чтобы сбросить пароль, перейдите по ссылке: ${resetUrl}`,
                html: `<!DOCTYPE html>${html}`,
            });
        } catch (emailError) {
            logger.error('Failed to send reset password email:', emailError);
        }

        return NextResponse.json(
            {
                message: 'Если пользователь с таким email существует, ссылка для сброса пароля была отправлена.',
                // Include token in development only
                ...(process.env.NODE_ENV === 'development' && {
                    token: resetToken,
                    resetUrl: `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`,
                }),
            },
            { status: 200 }
        );
    } catch (error) {
        logger.error('Forgot password error:', error);
        return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
export const POST = withLogging(POSTHandler);
