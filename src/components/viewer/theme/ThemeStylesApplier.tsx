'use client';

import { useColorMode } from '@/components/ui/color-mode';
import { BackgroundSettings } from '@/types';
import { Theme } from '@/types/theme';
import { useThemeApplication } from '@/hooks/useThemeApplication';

interface ThemeStylesApplierProps {
    theme: Theme | null;
    backgroundSettings?: BackgroundSettings;
    children: React.ReactNode;
    className?: string;
}

const ThemeStylesApplier: React.FC<ThemeStylesApplierProps> = ({
    theme,
    backgroundSettings,
    children,
    className = '',
}) => {
    const { setColorMode } = useColorMode();

    const { containerRef } = useThemeApplication({
        theme,
        backgroundSettings,
        setColorMode,
    });

    return (
        <div ref={containerRef} className={className}>
            {children}
        </div>
    );
};

export default ThemeStylesApplier;
