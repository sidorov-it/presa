'use client';

import React from 'react';
import { ColorMode, useColorMode } from '@/components/ui/color-mode';
import { Theme } from '@/types/theme';
import { useThemeApplication } from '@/hooks/useThemeApplication';
import FontLoader from '@/components/theme/components/Fonts/FontLoader';
import { usePresentationStore } from '@/store/presentationStore';
import { useShallow } from 'zustand/react/shallow';

interface ThemeStylesApplierProps {
    theme: Theme | null;
    presentationId?: string;
    children: React.ReactNode;
    className?: string;
    colorMode?: ColorMode;
}

const ThemeStylesApplier: React.FC<ThemeStylesApplierProps> = ({ theme, children, className = '', presentationId }) => {
    const { colorMode, setColorMode } = useColorMode();

    const backgroundSettings = usePresentationStore(
        useShallow(state => {
            if (!presentationId) return undefined;
            return state.getBackgroundSettings(presentationId);
        })
    );

    const { containerRef } = useThemeApplication({
        theme,
        backgroundSettings,
        setColorMode,
        colorMode,
    });

    return (
        <div ref={containerRef} className={className}>
            {theme && <FontLoader theme={theme} />}
            {children}
        </div>
    );
};

export default ThemeStylesApplier;
