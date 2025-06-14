import React from 'react';
import { IPresentation } from '@/types';
import { Theme } from '@/types/theme';
import FullscreenViewer from './FullscreenViewer';
import ThemeStylesApplier from './theme/ThemeStylesApplier';

interface ThemedFullscreenViewerProps {
    presentation: IPresentation;
    theme: Theme;
    initialSlideIndex?: number;
    onClose?: () => void;
    className?: string;
}

const ThemedFullscreenViewer: React.FC<ThemedFullscreenViewerProps> = ({
    presentation,
    theme,
    initialSlideIndex = 0,
    onClose,
    className = '',
}) => {
    return (
        <ThemeStylesApplier
            theme={theme}
            backgroundSettings={presentation.backgroundSettings}
            className={`themed-fullscreen-viewer ${className}`}
        >
            {/* Render fullscreen viewer with theme */}
            <FullscreenViewer presentation={presentation} initialSlideIndex={initialSlideIndex} onClose={onClose} />
        </ThemeStylesApplier>
    );
};

export default ThemedFullscreenViewer;
