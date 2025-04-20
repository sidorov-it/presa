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
            <div
                style={{
                    paddingLeft: '1rem',
                    paddingRight: '1rem',
                    paddingTop: '2.5rem',
                    paddingBottom: '2.5rem',
                    width: '100%',
                    minHeight: '100vh',
                }}
            >
                <div style={{ marginTop: '5rem', maxWidth: '72rem' }}>{children}</div>
            </div>
        </>
    );
};

export default PresentationThemeWrapper;
