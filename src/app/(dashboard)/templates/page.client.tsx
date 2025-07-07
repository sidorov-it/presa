'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/Card/Card';
import SlidePreview from '../dashboard/components/SlidePreview';
import {
    PresentationTemplates,
    PresentationTemplateKeys,
} from '@/presentationTemplates';
import styles from './page.module.css';
import { useThemeStore } from '@/store/themeStore';
import Link from 'next/link';

import FullPageLoader from '@/components/FullPageLoader/FullPageLoader';

const TEMPLATE_KEYS = Object.keys(PresentationTemplates) as PresentationTemplateKeys[];

const TemplatesPage = () => {
    const router = useRouter();
    const { loadPresentation } = usePresentationStore();
    const defaultThemes = useThemeStore(state => state.defaultThemes);
    const loadThemes = useThemeStore(state => state.loadThemes);

    const [isLoading, setIsLoading] = useState(false);

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
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Шаблоны</h1>
            </div>

            {isLoading ? (
                <FullPageLoader />
            ) : (
                <div className={styles.templatesGrid}>
                    {TEMPLATE_KEYS.map(key => {
                        const template = PresentationTemplates[key];
                        const theme =
                            defaultThemes.find(t => t.id === template.themeId) || defaultThemes[0];

                        if (!theme) {
                            return null;
                        }
                        return (
                            <Card key={key} className={styles.templateCard}>
                                <CardHeader>
                                    <CardTitle>{template.title}</CardTitle>
                                    <CardDescription>{template.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className={styles.templatePreview}>
                                        <SlidePreview presentation={template} theme={theme} />
                                    </div>
                                    <div className={styles.templateActions}>
                                        <Link
                                            href={`/templates/${key}`}
                                            className={styles.previewButton}
                                        >
                                            Просмотр
                                        </Link>
                                        <button
                                            onClick={() => handleTemplateUse(key)}
                                            className={styles.useButton}
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
        </div>
    );
};

export default TemplatesPage;
