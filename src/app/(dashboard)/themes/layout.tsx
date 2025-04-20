'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { resetThemeStyles } from '@/utils/themeUtils';

export default function ThemesLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [previousPath, setPreviousPath] = useState<string | null>(null);

    // Track path changes to detect when leaving editor pages
    useEffect(() => {
        // If the previous path contained '/edit' or '/docs' and the current one doesn't
        // we're navigating away from an editor page
        if (
            previousPath &&
            (previousPath.includes('/edit') || previousPath.includes('/docs')) &&
            !pathname.includes('/edit') &&
            !pathname.includes('/docs')
        ) {
            console.log('Navigating away from editor page, resetting theme styles');
            resetThemeStyles();
        }

        // Update the previous path
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
