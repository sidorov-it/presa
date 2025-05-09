import React from 'react';
import { IPresentation } from '@/types';
import { Theme } from '@/types/theme';
import ThemedPresentationViewer from './ThemedPresentationViewer';
import styles from './PresentationPreview.module.css';

interface PresentationPreviewProps {
    presentation: IPresentation;
    theme: Theme;
    initialSlideIndex?: number;
    showThumbnails?: boolean;
    className?: string;
}

const PresentationPreview: React.FC<PresentationPreviewProps> = ({
    presentation,
    theme,
    initialSlideIndex = 0,
    showThumbnails = true,
    className = '',
}) => {
    // Проверяем, является ли theme действительной темой
    const hasValidTheme = theme && theme.id && theme.colors && theme.typography;

    return (
        <div
            className={`presentation-preview ${className}`}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                backgroundColor: hasValidTheme ? 'var(--presentation-page-background-color, #f9fafb)' : '#f9fafb',
                backgroundImage: hasValidTheme ? 'var(--presentation-page-background-image, none)' : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                overflow: 'hidden',
            }}
        >
            {presentation.description && (
                <div className={styles.topicContainer}>
                    <p className={styles.topic}>
                        {presentation.description.startsWith('Generated from prompt:')
                            ? presentation.description.replace('Generated from prompt:', 'Topic:').trim()
                            : presentation.description}
                    </p>
                </div>
            )}
            <ThemedPresentationViewer
                presentation={presentation}
                theme={theme}
                initialSlideIndex={initialSlideIndex}
                showThumbnails={showThumbnails}
            />
        </div>
    );
};

export default PresentationPreview;
