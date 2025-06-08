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
        <div className={`themed-fullscreen-viewer ${className}`}>
            {/* Apply theme styles */}
            <ThemeStylesApplier theme={theme} backgroundSettings={presentation.backgroundSettings} />

            {/* Render fullscreen viewer with theme */}
            <FullscreenViewer presentation={presentation} initialSlideIndex={initialSlideIndex} onClose={onClose} />
        </div>
    );
};

export default ThemedFullscreenViewer;
