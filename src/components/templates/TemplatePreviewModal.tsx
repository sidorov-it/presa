/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
'use client';
import { useMemo, useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { PresentationTemplateKeys, createPresentationFromTemplate } from '@/presentationTemplates';
import { useThemeStore } from '@/store/themeStore';
import Portal from '@/components/Portal';
import ScopedThemeStylesApplier from '@/components/viewer/theme/ScopedThemeStylesApplier/ScopedThemeStylesApplier';
import PresentationViewer from '@/components/viewer/PresentationViewer/PresentationViewer';
import { Slide } from '@/types';
import styles from './TemplatePreviewModal.module.css';

interface TemplatePreviewModalProps {
    templateId: PresentationTemplateKeys | null;
    isOpen: boolean;
    onClose: () => void;
    onUseTemplate?: (templateId: PresentationTemplateKeys) => void;
}

export default function TemplatePreviewModal({
    templateId,
    isOpen,
    onClose,
    onUseTemplate,
}: TemplatePreviewModalProps) {
    const defaultThemes = useThemeStore(state => state.defaultThemes);

    const presentation = useMemo(() => {
        if (!templateId) return null;
        const template = createPresentationFromTemplate(templateId);
        return {
            ...template,
            slides: template.slides as Slide[],
        };
    }, [templateId]);

    const theme = defaultThemes[0];

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

    const handleUseTemplate = () => {
        if (templateId && onUseTemplate) {
            onUseTemplate(templateId);
        }
        onClose();
    };

    if (!isOpen || !presentation || !theme) return null;

    return (
        <Portal>
            <div className={styles.modal} tabIndex={-1} role="dialog" aria-modal="true" onKeyDown={handleKeyDown}>
                <div className={styles.backdrop} onClick={onClose} aria-label="Закрыть" />
                <div ref={modalRef} className={styles.content} tabIndex={0}>
                    <div className={styles.header}>
                        <h2 className={styles.title}>{presentation.title}</h2>
                        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
                            <FiX className={styles.closeIcon} />
                        </button>
                    </div>
                    <div className={styles.body}>
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
                    <div className={styles.footer}>
                        <button type="button" className={styles.cancelButton} onClick={onClose}>
                            Отмена
                        </button>
                        <button type="button" className={styles.useTemplateButton} onClick={handleUseTemplate}>
                            Использовать шаблон
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
