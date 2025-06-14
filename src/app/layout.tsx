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
        <html lang="ru" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap"
                    rel="stylesheet"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Raleway:wght@100;200;300;400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap"
                    rel="stylesheet"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
                    rel="stylesheet"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Lato:wght@100;300;400;700;900&display=swap"
                    rel="stylesheet"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@200;300;400;600;700;900&display=swap"
                    rel="stylesheet"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Nunito:wght@200;300;400;600;700;800;900&display=swap"
                    rel="stylesheet"
                    crossOrigin="anonymous"
                />
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
                        {process.env.NODE_ENV === 'development' && <HistoryDebugPopup />}
                    </Provider>
                </NextAuthProvider>
            </body>
        </html>
    );
}
