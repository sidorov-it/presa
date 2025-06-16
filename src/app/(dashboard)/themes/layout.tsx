'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ThemesLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [previousPath, setPreviousPath] = useState<string | null>(null);

    // Track path changes to detect when leaving editor pages
    useEffect(() => {
        setPreviousPath(pathname);
    }, [pathname, previousPath]);

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Main content */}
            <div style={{ display: 'flex', overflow: 'hidden', flexDirection: 'column', flex: '1 1 0%' }}>
                <main style={{ overflowY: 'auto', overflowX: 'hidden', flex: '1 1 0%' }}>{children}</main>
            </div>
        </div>
    );
}
