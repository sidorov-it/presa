import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { PurchaseStatus } from '@prisma/client';
import { sendVerificationEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

async function POSTHandler(req: NextRequest) {
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
        const verificationToken = uuidv4();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const newUser = await prisma.$transaction(
            async (tx: any) => {
                const user = await tx.user.create({
                    data: {
                        name,
                        email,
                        password: hashedPassword,
                        verificationToken,
                        verificationTokenExpires: verificationExpires,
                        isVerified: false,                        emailPreferences: { emailUpdates: true },
                    },
                });

                const welcomePackage = await tx.tokenPackage.findFirst({
                    where: { packageType: 'welcome' },
                });
                if (!welcomePackage) {
                    throw new Error('Welcome package not found');
                }

                await tx.tokenPurchase.create({
                    data: {
                        userId: user.id,
                        packageId: welcomePackage.id,
                        packageType: 'welcome',
                        tokensAmount: 200,
                        price: 0,
                        currency: 'RUB',
                        status: PurchaseStatus.completed,
                        paymentProvider: '',
                        paymentId: 'welcome',
                        sessionId: 'welcome',
                        purchasedAt: new Date(),
                        completedAt: new Date(),
                        metadata: {
                            welcomePackage: true,
                        },
                    },
                });
                await tx.userTokens.create({
                    data: {
                        userId: user.id,
                        balance: 200,
                        totalUsed: 0,
                    },
                });

                return user;
            },
            {
                timeout: 1000000,
            }
        );
        // Create new user
        // Send welcome email (errors are logged but do not block registration)
        try {
            await sendVerificationEmail(newUser.email, verificationToken);
        } catch (emailError) {
            logger.error('Failed to send verification email:', emailError);
        }

        // Return success response (without sensitive data)
        return NextResponse.json(
            {
                message: 'Пользователь успешно зарегистрирован',
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        logger.error('Registration error:', error);
        return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
export const POST = withLogging(POSTHandler);
