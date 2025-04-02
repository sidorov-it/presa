import './globals.css';
import '@/styles/theme.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextAuthProvider } from '@/components/providers/NextAuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
    title: 'Presa - Create Presentations with AI',
    description: 'Create beautiful presentations with artificial intelligence',
};

export default function RootLayout({
    children,
}: {
  children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen`}>
                <NextAuthProvider>
                    <ThemeProvider>
                        {children}
                    </ThemeProvider>
                </NextAuthProvider>
                <Toaster />
            </body>
        </html>
    );
}
