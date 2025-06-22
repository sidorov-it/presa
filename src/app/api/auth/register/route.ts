import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    try {
        // Parse the request body
        const { name, email, password } = await req.json();

        // Validate the input
        if (!name || !email || !password) {
            return NextResponse.json({ message: 'Не все обязательные поля заполнены' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ message: 'Пароль должен содержать не менее 8 символов' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ message: 'Пользователь с таким email уже существует' }, { status: 409 });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create new user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                isVerified: true, // For simplicity, we're setting users as verified by default
                emailPreferences: { emailUpdates: true },
            },
        });

        // Send welcome email (errors are logged but do not block registration)
        try {
            await sendEmail({
                to: user.email,
                subject: 'Добро пожаловать в slydle.ru',
                text: `Здравствуйте, ${user.name}! Вы успешно зарегистрировались на slydle.ru.`,
            });
        } catch (emailError) {
            logger.error('Failed to send registration email:', emailError);
        }

        // Return success response (without sensitive data)
        return NextResponse.json(
            {
                message: 'Пользователь успешно зарегистрирован',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        logger.error('Registration error:', error);
        return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
