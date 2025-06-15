import React from 'react';
import { IPresentation } from '@/types';
import { Theme } from '@/types/theme';
import PresentationViewer from './PresentationViewer';
import ThemeStylesApplier from './theme/ThemeStylesApplier';

interface ThemedPresentationViewerProps {
    presentation: IPresentation;
    theme: Theme;
    className?: string;
}

const ThemedPresentationViewer: React.FC<ThemedPresentationViewerProps> = ({ presentation, theme, className = '' }) => {
    return (
        <ThemeStylesApplier
            theme={theme}
            backgroundSettings={presentation.backgroundSettings}
            className={`themed-presentation-viewer ${className}`}
        >
            <PresentationViewer presentation={presentation} />
        </ThemeStylesApplier>
    );
};

export default ThemedPresentationViewer;
