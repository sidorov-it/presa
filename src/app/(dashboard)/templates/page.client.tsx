'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { usePresentationStore } from '@/store/presentationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card/Card';
import { PresentationTemplates, PresentationTemplateKeys, PreviewTemplateImages } from '@/presentationTemplates';
import { useThemeStore } from '@/store/themeStore';
import TemplatePreviewModal from '@/components/templates/TemplatePreviewModal';
import { Heading } from '@/components/ui/heading';

import FullPageLoader from '@/components/FullPageLoader/FullPageLoader';
import getImagePath from '@/utils/getImagePath';
import styles from './page.module.css';

const TEMPLATE_KEYS = Object.keys(PresentationTemplates) as PresentationTemplateKeys[];

const TemplatesPage = () => {
    const router = useRouter();
    const { loadPresentation } = usePresentationStore();
    const defaultThemes = useThemeStore(state => state.defaultThemes);
    const loadThemes = useThemeStore(state => state.loadThemes);

    const [isLoading, setIsLoading] = useState(false);
    const [previewId, setPreviewId] = useState<PresentationTemplateKeys | null>(null);

    const openPreview = (id: PresentationTemplateKeys) => setPreviewId(id);
    const closePreview = () => setPreviewId(null);

    const handleTemplateUse = async (templateId: PresentationTemplateKeys) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/templates/${templateId}/use`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Failed to create presentation');
            }
            const { presentation } = await response.json();
            await loadPresentation(presentation.id);
            router.push(`/docs/${presentation.id}`);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadThemes().catch(err => {
            console.error('Failed to load themes:', err);
        });
    }, [loadThemes]);

    return (
        <div
            className={styles.container}
            style={
                {
                    '--card-width': 'min(100vw, calc(100vh * 1.7777777777777777))',
                    '--card-height': 'calc(var(--card-width) / 1.7777777777777777 - 64px)',
                } as React.CSSProperties & { '--card-width': string; '--card-height': string }
            }
        >
            <div className={styles.header}>
                <Heading title="Шаблоны" description="Выберите готовый шаблон для быстрого создания презентации" />
            </div>

            {isLoading ? (
                <FullPageLoader />
            ) : (
                <div className={styles.cardsContainer}>
                    {TEMPLATE_KEYS.map(key => {
                        const template = PresentationTemplates[key];
                        const theme = defaultThemes.find(t => t.name === template.themeName) || defaultThemes[0];

                        if (!theme) {
                            return null;
                        }
                        return (
                            <Card key={key} className={styles.templateCard}>
                                <CardHeader className={styles.cardHeader}>
                                    <CardTitle className={styles.cardTitle}>{template.title}</CardTitle>
                                    <CardDescription>{template.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className={styles.templatePreview}>
                                        <Image
                                            src={getImagePath(PreviewTemplateImages[key])}
                                            alt={template.title}
                                            width={310}
                                            height={160}
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </div>
                                    <div className={styles.templateActions}>
                                        <button
                                            onClick={() => openPreview(key)}
                                            className={styles.previewButton}
                                            type="button"
                                        >
                                            Просмотр
                                        </button>
                                        <button
                                            onClick={() => handleTemplateUse(key)}
                                            className={styles.useButton}
                                            type="button"
                                        >
                                            Использовать
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
            <TemplatePreviewModal
                templateId={previewId}
                isOpen={previewId !== null}
                onClose={closePreview}
                onUseTemplate={handleTemplateUse}
            />
        </div>
    );
};

export default TemplatesPage;
