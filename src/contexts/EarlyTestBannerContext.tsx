'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface EarlyTestBannerContextType {
    isVisible: boolean;
    handleClose: () => void;
}

const EarlyTestBannerContext = createContext<EarlyTestBannerContextType | undefined>(undefined);

const excludedPaths = ['/view'];
const STORAGE_KEY = 'earlyTestBannerClosed';

export const EarlyTestBannerProvider = ({ children }: { children: ReactNode }) => {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const closed = sessionStorage.getItem(STORAGE_KEY);
        if (closed) {
            setIsVisible(false);
            return;
        }
        // Если путь исключён — баннер не показываем
        const isExcluded = excludedPaths.some(path => pathname.includes(path));
        if (isExcluded) {
            setIsVisible(false);
        } else {
            setIsVisible(true);
        }
    }, [pathname]);

    const handleClose = () => {
        sessionStorage.setItem(STORAGE_KEY, 'true');
        setIsVisible(false);
    };

    return (
        <EarlyTestBannerContext.Provider value={{ isVisible, handleClose }}>{children}</EarlyTestBannerContext.Provider>
    );
};

export const useEarlyTestBanner = () => {
    const context = useContext(EarlyTestBannerContext);
    if (!context) {
        throw new Error('useEarlyTestBanner must be used within an EarlyTestBannerProvider');
    }
    return context;
};
