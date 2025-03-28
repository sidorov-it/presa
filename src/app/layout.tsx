import GlobalBubbleMenu from '@/components/editor/GlobalBubbleMenu/GlobalBubbleMenu';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
    title: 'Presa - Создание презентаций с помощью ИИ',
    description: 'Создавайте красивые презентации с помощью искусственного интеллекта',
};

export default function RootLayout({
    children,
}: {
  children: React.ReactNode;
}) {
    return (
        <html lang="ru">
            <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen`}>
                {children}
                <GlobalBubbleMenu />
            </body>
        </html>
    );
}
