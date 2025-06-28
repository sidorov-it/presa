'use client';

import { forwardRef, useRef } from 'react';
import { Theme } from '@/types/theme';
import { useThemeStore } from '@/store/themeStore';
import { useThemeApplication } from '@/hooks/useThemeApplication';
import ThemeDebugButton from '@/components/debug/ThemeDebugButton';

import styles from './ScopedThemeStylesApplier.module.css';
import { ColorMode } from '@/components/ui/color-mode';

interface ScopedThemeStylesApplierProps {
    theme: Theme | null;
    children: React.ReactNode;
    className?: string;
    colorMode?: ColorMode;
}

const ScopedThemeStylesApplier = forwardRef<HTMLDivElement, ScopedThemeStylesApplierProps>(
    ({ theme, children, colorMode, className = '' }, ref) => {
        const defaultThemes = useThemeStore(state => state.defaultThemes);
        const internalRef = useRef<HTMLDivElement>(null);

        // Use the provided ref or fallback to our internal ref
        const finalRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;

        useThemeApplication({
            theme,
            defaultThemes,
            externalRef: finalRef,
            colorMode,
        });

        return (
            <div ref={finalRef} className={`scoped-theme-container ${styles.container} ${className}`}>
                {children}

                {process.env.NODE_ENV === 'development' && <ThemeDebugButton />}
            </div>
        );
    }
);

ScopedThemeStylesApplier.displayName = 'ScopedThemeStylesApplier';

export default ScopedThemeStylesApplier;
