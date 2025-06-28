'use client';

import React from 'react';
import { ColorMode, useColorMode } from '@/components/ui/color-mode';
import { BackgroundSettings } from '@/types';
import { Theme } from '@/types/theme';
import { useThemeApplication } from '@/hooks/useThemeApplication';
import FontLoader from '@/components/theme/components/Fonts/FontLoader';

interface ThemeStylesApplierProps {
    theme: Theme | null;
    backgroundSettings?: BackgroundSettings;
    children: React.ReactNode;
    className?: string;
    colorMode?: ColorMode;
}

const ThemeStylesApplier: React.FC<ThemeStylesApplierProps> = ({
    theme,
    backgroundSettings,
    children,
    className = '',
}) => {
    const { colorMode, setColorMode } = useColorMode();

    const { containerRef } = useThemeApplication({
        theme,
        backgroundSettings,
        setColorMode,
        colorMode,
    });

    return (
        <div ref={containerRef} className={className}>
            <FontLoader theme={theme} />
            {children}
        </div>
    );
};

export default ThemeStylesApplier;
