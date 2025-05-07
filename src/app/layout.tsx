import './globals.css';
import '@/styles/theme.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextAuthProvider } from '@/components/providers/NextAuthProvider';
import { Provider } from '@/components/ui/provider';
import SideMenuRenderer from '@/components/editor/Menus/SideMenuRenderer/SideMenuRenderer';
import HistoryDebugPopup from '@/components/ui/HistoryDebugPopup';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
    title: 'Presa - Create Presentations with AI',
    description: 'Create beautiful presentations with artificial intelligence',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
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
                        <HistoryDebugPopup />
                    </Provider>
                </NextAuthProvider>
            </body>
        </html>
    );
}
