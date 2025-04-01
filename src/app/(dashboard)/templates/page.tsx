'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
import { Heading } from "@/components/ui/heading"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/Button"
import { Plus } from "lucide-react"

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
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Heading
                    title="Templates"
                    description="Manage your presentation templates"
                />
                <Button onClick={handleCreateTemplate}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Template
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {TEMPLATES.map((template) => (
                        <Card 
                            key={template.id}
                            className="hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handleTemplateSelect(template.id)}
                        >
                            <CardHeader>
                                <CardTitle>{template.title}</CardTitle>
                                <CardDescription>{template.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="aspect-video bg-gray-100 rounded-md"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TemplatesPage 