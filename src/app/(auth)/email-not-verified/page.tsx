import type { Metadata } from 'next';
import EmailNotVerifiedPage from './page.client';
import { useSession } from 'next-auth/react';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const metadata: Metadata = {
    title: 'Подтвердите почту',
};

export default async function Wrapper(context: { req: NextRequest; res: NextResponse }) {
    const session = await getServerSession(authOptions)

    const email = session?.user?.email || '';

    return <EmailNotVerifiedPage email={email} />;
}
