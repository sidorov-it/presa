'use client';

import React from 'react';
import { Theme } from '@/types/theme';
import ThemeStylesApplier from './ThemeStylesApplier';

interface PresentationThemeWrapperProps {
    theme: Theme | null;
    children: React.ReactNode;
}

const PresentationThemeWrapper: React.FC<PresentationThemeWrapperProps> = ({ theme, children }) => {
    return (
        <>
            {/* Apply theme styles using the client component */}
            <ThemeStylesApplier theme={theme} />

            {/* Render the server components inside */}
            <div className="min-h-screen w-full py-10 px-4 themed-page">
                <div className="max-w-6xl mx-auto space-y-20">{children}</div>
            </div>
        </>
    );
};

export default PresentationThemeWrapper;
