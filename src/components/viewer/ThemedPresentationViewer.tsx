import React from 'react';
import { Presentation } from '@/types';
import { Theme } from '@/types/theme';
import PresentationViewer from './PresentationViewer';
import ThemeStylesApplier from './theme/ThemeStylesApplier';

interface ThemedPresentationViewerProps {
    presentation: Presentation;
    theme: Theme;
    initialSlideIndex?: number;
    className?: string;
}

const ThemedPresentationViewer: React.FC<ThemedPresentationViewerProps> = ({
    presentation,
    theme,
    initialSlideIndex = 0,
    className = '',
}) => {
    return (
        <div className={`themed-presentation-viewer ${className}`}>
            {/* Apply theme styles */}
            <ThemeStylesApplier theme={theme} />

            {/* Render presentation with theme */}
            <PresentationViewer presentation={presentation} initialSlideIndex={initialSlideIndex} />
        </div>
    );
};

export default ThemedPresentationViewer;
