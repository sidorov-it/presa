import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Просмотр презентации',
    description: 'Страницы для просмотра созданных презентаций',
};

export default function ViewerLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="viewer-layout">
            {children}
        </div>
    );
}
