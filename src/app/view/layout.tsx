import { Inter } from 'next/font/google';
import '../../app/globals.css';
import type { Metadata } from 'next';
import { NextAuthProvider } from '@/components/providers/NextAuthProvider';
import { Provider } from '@/components/ui/provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Presentation Viewer',
    description: 'View presentations created with Presa',
};

export default function ViewerLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <body
                className={`${inter.className}`}
                style={{
                    minHeight: '100vh',
                    color: '#111827',
                }}
            >
                <NextAuthProvider>
                    <Provider>{children}</Provider>
                </NextAuthProvider>
            </body>
        </html>
    );
}
