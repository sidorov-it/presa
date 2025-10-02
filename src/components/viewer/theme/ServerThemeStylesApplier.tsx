/* eslint-disable indent */
/* eslint-disable prettier/prettier */
import React from 'react';
import { Theme } from '@/types/theme';
import { BackgroundSettings } from '@/types';
import { themeToCSSVariables } from '@/utils/themeCssVariables';
import ServerFontLoader from '@/components/theme/components/Fonts/ServerFontLoader';

interface ServerThemeStylesApplierProps {
    theme: Theme | null;
    backgroundSettings?: BackgroundSettings;
    children: React.ReactNode;
    className?: string;
}

const ServerThemeStylesApplier: React.FC<ServerThemeStylesApplierProps> = ({
    theme,
    backgroundSettings,
    children,
    className = '',
}) => {
    if (!theme) {
        return <div className={className}>{children}</div>;
    }

    // Generate CSS variables on the server
    const cssVariables = themeToCSSVariables(theme, backgroundSettings);

    // Convert CSS variables to inline styles
    const inlineStyles: React.CSSProperties = {
        ...cssVariables,
        // Apply background styles directly to the container
        ...(theme.colors.pageBackground?.imageUrl && {
            backgroundImage: `url(${theme.colors.pageBackground.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
        }),
        ...(backgroundSettings?.backgroundImage &&
            backgroundSettings.backgroundImage !== 'none' && {
            backgroundImage: `url(${backgroundSettings.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
        }),
    };

    return (
        <>
            {/* Load fonts on server */}
            <ServerFontLoader theme={theme} />
            {/* Embed CSS variables in a style tag for global access */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                        :root {
                            ${Object.entries(cssVariables)
                                .map(([key, value]) => `${key}: ${value};`)
                                .join('\n                            ')}
                        }
                    `,
                }}
            />
            <div style={inlineStyles} className={className}>
                {children}
            </div>
        </>
    );
};

export default ServerThemeStylesApplier;
