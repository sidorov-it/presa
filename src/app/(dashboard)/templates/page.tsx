'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';

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

export default function TemplatesPage() {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Templates</h1>
        <p className="text-gray-600 mt-2">
          Choose a template to start your presentation
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map((template) => (
            <div 
              key={template.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleTemplateSelect(template.id)}
            >
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                {/* In a real app, you would use actual template preview images */}
                <div className="text-gray-400 text-center px-4">
                  <span className="block text-lg font-medium">{template.title}</span>
                  <span className="text-sm">Preview image</span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-lg mb-1">{template.title}</h3>
                <p className="text-sm text-gray-500 mb-2">
                  {template.description}
                </p>
                <div className="text-xs text-gray-400">
                  {template.slides} slides
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 