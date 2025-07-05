import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Просмотр презентации',
    description: 'Режим просмотра презентации',
};

export default function ViewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
