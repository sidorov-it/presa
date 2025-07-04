'use client';

import React from 'react';
import { Theme } from '@/types/theme';
import ScopedThemeStylesApplier from './ScopedThemeStylesApplier/ScopedThemeStylesApplier';

interface ScopedPresentationThemeWrapperProps {
    theme: Theme | null;
    children: React.ReactNode;
    className?: string;
}

const ScopedPresentationThemeWrapper: React.FC<ScopedPresentationThemeWrapperProps> = ({
    theme,
    children,
    className = '',
}) => {
    return (
        <ScopedThemeStylesApplier theme={theme} className={className}>
            {/* <div
                style={{
                    padding: '1rem',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            > */}
            <div
                style={{
                    width: '100%',
                    // maxWidth: '600px',
                    // transform: 'scale(0.8)',
                    // zoom: 0.6,
                    transformOrigin: 'center center',
                }}
            >
                {children}
            </div>
            {/* </div> */}
        </ScopedThemeStylesApplier>
    );
};

export default ScopedPresentationThemeWrapper;
