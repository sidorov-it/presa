'use client';
import { IPresentation } from '@/types';
import { Theme } from '@/types/theme';
import PresentationViewer from '@/components/viewer/PresentationViewer/PresentationViewer';
import ScopedThemeStylesApplier from '@/components/viewer/theme/ScopedThemeStylesApplier/ScopedThemeStylesApplier';
import styles from './page.module.css';

interface Props {
    presentation: IPresentation;
    theme: Theme;
}

export default function TemplatePreview({ presentation, theme }: Props) {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{presentation.title}</h1>
            <ScopedThemeStylesApplier theme={theme} className={styles.viewerWrapper}>
                <PresentationViewer
                    slides={presentation.slides}
                    theme={theme}
                    showImagePlaceholder
                    isPreview
                    primaryAccentColor={theme?.colors.primaryAccent || '#000'}
                />
            </ScopedThemeStylesApplier>
        </div>
    );
}
