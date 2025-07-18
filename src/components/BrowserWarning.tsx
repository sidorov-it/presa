'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import * as detectBrowser from 'detect-browser';
const browser = detectBrowser.detect();
window.taoster = toast;

const WARNING_KEY = 'chromeWarningShown';

export default function BrowserWarning() {
    const pathname = usePathname();

    useEffect(() => {
        if (!pathname) return;

        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
        const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p));
        const isViewPage = pathname.startsWith('/view');
        if (isPublic || isViewPage) {
            return;
        }

        const shown = sessionStorage.getItem(WARNING_KEY);
        if (shown) return;

        if (browser?.name !== 'chrome') {
            setTimeout(() => {
                toast.error(
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '10px',
                        }}
                    >
                        <p>Лучше всего сервис работает в браузере Chrome</p>
                    </div>
                );
            }, 2000);
            sessionStorage.setItem(WARNING_KEY, 'true');
        }
    }, [pathname]);

    return null;
}
