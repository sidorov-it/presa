import type { Metadata } from 'next';
import EmailNotVerifiedPage from './page.client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const metadata: Metadata = {
    title: 'Подтвердите почту',
};

export default async function Wrapper() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect('/login');
    }

    const emailVerified = session.user.emailVerified;

    if (emailVerified) {
        redirect('/dashboard');
    }

    const email = session.user.email || '';

    return <EmailNotVerifiedPage email={email} />;
}
