'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card/Card';
import SlidePreview from '../dashboard/components/SlidePreview';
import { PresentationTemplates, PresentationTemplateKeys } from '@/presentationTemplates';
import styles from './page.module.css';
import { THEME_TEMPLATES } from '@/themes/themeTemplates';
import Portal from '@/components/Portal';

const TEMPLATE_KEYS = Object.keys(PresentationTemplates) as PresentationTemplateKeys[];

const TemplatesPage = () => {
    const router = useRouter();
    const { createPresentation, updatePresentation } = usePresentationStore();

    const [isLoading, setIsLoading] = useState(false);

    const handleTemplateSelect = async (templateId: PresentationTemplateKeys) => {
        setIsLoading(true);
        const template = PresentationTemplates[templateId];

        try {
            const presentationId = await createPresentation(template.title);
            updatePresentation(presentationId, {
                title: template.title,
                description: template.description,
                slides: template.slides,
            });
            router.push(`/docs/${presentationId}`);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Шаблоны</h1>
            </div>

            {isLoading ? (
                <Portal>
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                    </div>
                </Portal>
            ) : (
                <div className={styles.templatesGrid}>
                    {TEMPLATE_KEYS.map(key => {
                        const template = PresentationTemplates[key];
                        const theme = THEME_TEMPLATES.find(t => t.id === template.themeId);

                        if (!theme) {
                            return null;
                        }
                        return (
                            <Card key={key} className={styles.templateCard} onClick={() => handleTemplateSelect(key)}>
                                <CardHeader>
                                    <CardTitle>{template.title}</CardTitle>
                                    <CardDescription>{template.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className={styles.cap} />
                                    <div className={styles.templatePreview}>
                                        <SlidePreview presentation={template} theme={theme} />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TemplatesPage;
