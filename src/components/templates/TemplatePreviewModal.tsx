/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
'use client';
import { useMemo, useEffect, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { PresentationTemplateKeys, createPresentationFromTemplate } from '@/presentationTemplates';
import { useThemeStore } from '@/store/themeStore';
import Portal from '@/components/Portal';
import ScopedThemeStylesApplier from '@/components/viewer/theme/ScopedThemeStylesApplier/ScopedThemeStylesApplier';
import PresentationViewer from '@/components/viewer/PresentationViewer/PresentationViewer';
import { Slide } from '@/types';
import styles from './TemplatePreviewModal.module.css';
import { getSlideLayoutVars } from '@/utils/themeUtils';
import { ThemeStylesApplier } from '../viewer';

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
    const modalRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const [modalDimensions, setModalDimensions] = useState({ width: 0, height: 0 });

    const allThemes = useThemeStore(state => state.allThemes);

    const presentation = useMemo(() => {
        if (!templateId) return null;
        const template = createPresentationFromTemplate(templateId);
        return {
            ...template,
            slides: template.slides as Slide[],
        };
    }, [templateId]);

    const theme = allThemes.find(theme => theme.id === presentation?.themeId) || defaultThemes[0];

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

    // Измеряем размеры модального окна
    useEffect(() => {
        const updateDimensions = () => {
            if (bodyRef.current) {
                const rect = bodyRef.current.getBoundingClientRect();
                setModalDimensions({
                    width: rect.width,
                    height: rect.height,
                });
            }
        };

        if (isOpen) {
            setTimeout(updateDimensions, 100); // Даем время на рендер
        }
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

    // Рассчитываем CSS переменные для модального окна
    const layoutVars = getSlideLayoutVars({
        aspectRatio: 1.7777777777777777,
        cardFontScale: 1,
        renderMode: 'view',
        containerWidth: modalDimensions.width,
        containerHeight: modalDimensions.height,
        useContainerScaling: true,
    });

    return (
        <Portal>
            <ThemeStylesApplier theme={theme}>
                <div
                    className={styles.modal}
                    tabIndex={-1}
                    role="dialog"
                    aria-modal="true"
                    onKeyDown={handleKeyDown}
                    style={
                        {
                            '--card-width': 'min(100vw, calc(100vh * 1.7777777777777777))',
                            '--card-height': 'calc(var(--card-width) / 1.7777777777777777 - 64px)',
                        } as React.CSSProperties & {
                            '--card-width': string;
                            '--card-height': string;
                        }
                    }
                >
                    <div className={styles.backdrop} onClick={onClose} aria-label="Закрыть" />
                    <div ref={modalRef} className={styles.content} tabIndex={0}>
                        <div className={styles.header}>
                            <h2 className={styles.title}>{presentation.title}</h2>
                            <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
                                <FiX className={styles.closeIcon} />
                            </button>
                        </div>
                        <div ref={bodyRef} className={styles.body} style={layoutVars as React.CSSProperties}>
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
            </ThemeStylesApplier>
        </Portal>
    );
}
