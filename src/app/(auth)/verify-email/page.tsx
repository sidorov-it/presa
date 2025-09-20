'use server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import VerifyEmailClient from './page.client';

export default async function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
    const session = await getServerSession(authOptions);
    const token = (await searchParams).token;

    if (!token) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h1>Недействительная ссылка</h1>
                <p>Ссылка для подтверждения email недействительна или отсутствует.</p>
            </div>
        );
    }

    const user = await prisma.user.findFirst({
        where: {
            verificationToken: token,
        },
    });

    if (!user) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h1>Недействительный токен</h1>
                <p>Токен для подтверждения email недействителен или уже был использован.</p>
            </div>
        );
    }

    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h1>Токен истек</h1>
                <p>Срок действия токена для подтверждения email истек. Пожалуйста, запросите новую ссылку.</p>
            </div>
        );
    }

    // Update user verification status
    await prisma.user.update({
        where: { id: user.id },
        data: {
            verificationToken: null,
            verificationTokenExpires: null,
            isVerified: true,
            emailVerified: new Date(),
        },
    });

    // Return success component with continue button
    return <VerifyEmailClient isAuthenticated={!!session} />;
}
