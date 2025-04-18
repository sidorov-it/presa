'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { resetThemeStyles } from '@/utils/themeUtils';
import {
    FaChalkboard,
    FaHome,
    FaPalette,
    FaTrash,
    FaCog,
    FaCreditCard,
    FaSignOutAlt,
    FaBars,
    FaTimes,
} from 'react-icons/fa';

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
        <div className="min-h-screen bg-gray-50 flex">
            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">{children}</main>
            </div>
        </div>
    );
}
