'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
import { useThemeStore } from '@/store/themeStore';
import { Heading } from '@/components/ui/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import SlidePreview from '../dashboard/components/SlidePreview';
import {
    PresentationTemplates,
    PresentationTemplateKeys,
} from '@/presentationTemplates';
import styles from './page.module.css';

const TEMPLATE_KEYS = Object.keys(
    PresentationTemplates
) as PresentationTemplateKeys[];

// export const metadata = {
//     title: "Templates",
//     description: "Manage your presentation templates"
// }

const TemplatesPage = () => {
    const router = useRouter();
    const { createPresentation, updatePresentation } = usePresentationStore();
    const defaultTheme = useThemeStore(state => state.getDefaultTheme());
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
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTemplate = () => {
        // TODO: Implement template creation
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Heading title="Templates" description="Manage your presentation templates" />
                <Button onClick={handleCreateTemplate} className={styles.addButton}>
                    <Plus className={styles.buttonIcon} />
                    New Template
                </Button>
            </div>

            {isLoading ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                </div>
            ) : (
                <div className={styles.templatesGrid}>
                    {TEMPLATE_KEYS.map(key => {
                        const template = PresentationTemplates[key];
                        return (
                            <Card
                                key={key}
                                className={styles.templateCard}
                                onClick={() => handleTemplateSelect(key)}
                            >
                                <CardHeader>
                                    <CardTitle>{template.title}</CardTitle>
                                    <CardDescription>{template.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className={styles.templatePreview}>
                                        <SlidePreview presentation={template} theme={defaultTheme} />
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
