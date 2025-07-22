import './globals.css';
import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
import { NextAuthProvider } from '@/components/providers/NextAuthProvider';
import { Provider } from '@/components/ui/provider';
import SideMenuRenderer from '@/components/editor/Menus/SideMenuRenderer/SideMenuRenderer';
import YaMetrika from '@/components/metrika';
import BrowserWarning from '@/components/BrowserWarning';
import EarlyTestBanner from '@/components/EarlyTestBanner/EarlyTestBanner';
import { Suspense } from 'react';
import { EarlyTestBannerProvider } from '@/contexts/EarlyTestBannerContext';
// import Footer from '@/components/ui/Footer';

// const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
    title: 'Presa – создание презентаций с ИИ',
    description: 'Платформа для генерации и редактирования презентаций с помощью искусственного интеллекта',
    icons: {
        icon: [
            { url: '/uploads/logo.svg', type: 'image/svg+xml' },
            // { url: '/favicon.png', type: 'image/png' }
        ],
        shortcut: '/uploads/logo.svg',
        apple: '/uploads/logo.svg',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <head>
                <base
                    href={`${process.env.NODE_ENV === 'production' ? 'https://app.slydle.ru' : 'http://localhost:3000'}`}
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body
                // className={`${inter.className}`}
                style={{
                    minHeight: '100vh',
                    color: '#111827',
                }}
            >
                <NextAuthProvider>
                    <EarlyTestBannerProvider>
                        <Provider>
                            <BrowserWarning />
                            <EarlyTestBanner />
                            {children}
                            <SideMenuRenderer />
                            {/* <Footer /> */}
                        </Provider>
                    </EarlyTestBannerProvider>
                    {process.env.NODE_ENV === 'production' && (
                        <Suspense fallback={null}>
                            <YaMetrika />
                        </Suspense>
                    )}
                </NextAuthProvider>
            </body>
        </html>
    );
}
