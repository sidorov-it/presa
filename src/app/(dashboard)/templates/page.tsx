'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
import { Heading } from '@/components/ui/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import styles from './page.module.css';

// Sample template data
const TEMPLATES = [
    {
        id: 'business-pitch',
        title: 'Business Pitch',
        description: 'Perfect for pitching your business idea',
        image: '/templates/business-pitch.jpg',
        slides: 10,
    },
    {
        id: 'education',
        title: 'Educational Presentation',
        description: 'Great for teaching and educational content',
        image: '/templates/education.jpg',
        slides: 8,
    },
    {
        id: 'portfolio',
        title: 'Portfolio Showcase',
        description: 'Showcase your work and achievements',
        image: '/templates/portfolio.jpg',
        slides: 12,
    },
    {
        id: 'marketing',
        title: 'Marketing Plan',
        description: 'Present your marketing strategy',
        image: '/templates/marketing.jpg',
        slides: 9,
    },
    {
        id: 'project-proposal',
        title: 'Project Proposal',
        description: 'Propose your project with this template',
        image: '/templates/project-proposal.jpg',
        slides: 7,
    },
    {
        id: 'annual-report',
        title: 'Annual Report',
        description: 'Present annual financial and business results',
        image: '/templates/annual-report.jpg',
        slides: 15,
    },
];

// export const metadata = {
//     title: "Templates",
//     description: "Manage your presentation templates"
// }

const TemplatesPage = () => {
    const router = useRouter();
    const { createPresentation } = usePresentationStore();
    const [isLoading, setIsLoading] = useState(false);

    const handleTemplateSelect = (templateId: string) => {
        setIsLoading(true);
        // Create a new presentation based on the template
        // In a real app, you would fetch the template details from an API
        const template = TEMPLATES.find(t => t.id === templateId);

        if (template) {
            const presentationId = createPresentation(template.title);
            router.push(`/docs/${presentationId}`);
        }

        setIsLoading(false);
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
                    {TEMPLATES.map(template => (
                        <Card
                            key={template.id}
                            className={styles.templateCard}
                            onClick={() => handleTemplateSelect(template.id)}
                        >
                            <CardHeader>
                                <CardTitle>{template.title}</CardTitle>
                                <CardDescription>{template.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className={styles.templatePreview}></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TemplatesPage;
