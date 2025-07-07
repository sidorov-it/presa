'use client';
import { useMemo, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { PresentationTemplateKeys, PresentationTemplateDescriptors, createPresentationFromTemplate } from '@/presentationTemplates';
import { useThemeStore } from '@/store/themeStore';
import Portal from '@/components/Portal';
import ScopedThemeStylesApplier from '@/components/viewer/theme/ScopedThemeStylesApplier/ScopedThemeStylesApplier';
import PresentationViewer from '@/components/viewer/PresentationViewer/PresentationViewer';
import styles from './TemplatePreviewModal.module.css';

interface TemplatePreviewModalProps {
    templateId: PresentationTemplateKeys | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function TemplatePreviewModal({ templateId, isOpen, onClose }: TemplatePreviewModalProps) {
    const defaultThemes = useThemeStore(state => state.defaultThemes);

    const descriptor = templateId ? (PresentationTemplateDescriptors as any)[templateId] : null;

    const presentation = useMemo(() => {
        if (!templateId) return null;
        return createPresentationFromTemplate(templateId);
    }, [templateId]);

    const theme = descriptor ? defaultThemes.find(t => t.id === descriptor.themeId) : null;

    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => modalRef.current?.focus(), 0);
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen || !presentation || !theme) return null;

    return (
        <Portal>
            <div className={styles.modal} tabIndex={-1} role="dialog" aria-modal="true" onKeyDown={handleKeyDown}>
                <div className={styles.backdrop} onClick={onClose} aria-label="Закрыть" />
                <div ref={modalRef} className={styles.content} tabIndex={0}>
                    <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
                        <FiX className={styles.closeIcon} />
                    </button>
                    <h2 className={styles.title}>{presentation.title}</h2>
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
            </div>
        </Portal>
    );
}
