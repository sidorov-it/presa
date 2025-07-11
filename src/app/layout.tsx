import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextAuthProvider } from '@/components/providers/NextAuthProvider';
import { Provider } from '@/components/ui/provider';
import SideMenuRenderer from '@/components/editor/Menus/SideMenuRenderer/SideMenuRenderer';
import UIStateDebugButton from '@/components/debug/UIStateDebugButton';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
    title: 'Presa – создание презентаций с ИИ',
    description: 'Платформа для генерации и редактирования презентаций с помощью искусственного интеллекта',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body
                className={`${inter.className}`}
                style={{
                    minHeight: '100vh',
                    color: '#111827',
                }}
            >
                <NextAuthProvider>
                    <Provider>
                        {children}
                        <SideMenuRenderer />
                        {process.env.NODE_ENV === 'development' && <UIStateDebugButton />}
                    </Provider>
                </NextAuthProvider>
            </body>
        </html>
    );
}
