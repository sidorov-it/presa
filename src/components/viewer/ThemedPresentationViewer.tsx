import React from 'react';
import { IPresentation } from '@/types';
import { Theme } from '@/types/theme';
import PresentationViewer from './PresentationViewer';
import ThemeStylesApplier from './theme/ThemeStylesApplier';

interface ThemedPresentationViewerProps {
    presentation: IPresentation;
    theme: Theme;
    initialSlideIndex?: number;
    className?: string;
    showThumbnails?: boolean;
}

const ThemedPresentationViewer: React.FC<ThemedPresentationViewerProps> = ({
    presentation,
    theme,
    initialSlideIndex = 0,
    className = '',
    showThumbnails = true,
}) => {
    return (
        <div className={`themed-presentation-viewer ${className}`}>
            <ThemeStylesApplier theme={theme} backgroundSettings={presentation.backgroundSettings} />

            <PresentationViewer
                presentation={presentation}
                initialSlideIndex={initialSlideIndex}
                showThumbnails={showThumbnails}
            />
        </div>
    );
};

export default ThemedPresentationViewer;
