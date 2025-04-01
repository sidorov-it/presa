'use client';

import { useState } from 'react';

// Sample theme data
const THEMES = [
    {
        id: 'modern',
        name: 'Modern',
        description: 'Clean and minimalist design',
        primaryColor: '#3B82F6',
        previewBg: 'bg-blue-500',
    },
    {
        id: 'corporate',
        name: 'Corporate',
        description: 'Professional and business-oriented',
        primaryColor: '#1F2937',
        previewBg: 'bg-gray-800',
    },
    {
        id: 'creative',
        name: 'Creative',
        description: 'Bold and artistic design',
        primaryColor: '#EC4899',
        previewBg: 'bg-pink-500',
    },
    {
        id: 'nature',
        name: 'Nature',
        description: 'Inspired by natural elements',
        primaryColor: '#10B981',
        previewBg: 'bg-green-500',
    },
    {
        id: 'tech',
        name: 'Tech',
        description: 'Futuristic and technology-focused',
        primaryColor: '#6366F1',
        previewBg: 'bg-indigo-500',
    },
    {
        id: 'elegant',
        name: 'Elegant',
        description: 'Sophisticated and refined',
        primaryColor: '#9333EA',
        previewBg: 'bg-purple-600',
    },
];

export default function ThemesPage() {
    const [activeTheme, setActiveTheme] = useState<string | null>(null);

    const handleThemeSelect = (themeId: string) => {
        setActiveTheme(themeId);
    // In a real app, you would save the selected theme to the user's preferences
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Themes</h1>
                <p className="text-gray-600 mt-2">
          Choose a theme for your presentations
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {THEMES.map((theme) => (
                    <div 
                        key={theme.id}
                        className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
                            activeTheme === theme.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleThemeSelect(theme.id)}
                    >
                        <div className={`h-32 ${theme.previewBg} flex items-center justify-center text-white`}>
                            <div className="text-center">
                                <span className="block text-xl font-bold">{theme.name}</span>
                                <span className="text-sm opacity-80">Theme Preview</span>
                            </div>
                        </div>
            
                        <div className="p-4">
                            <h3 className="font-medium text-lg mb-1">{theme.name}</h3>
                            <p className="text-sm text-gray-500 mb-2">
                                {theme.description}
                            </p>

                            <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center">
                                    <div 
                                        className="w-5 h-5 rounded-full mr-2" 
                                        style={{ backgroundColor: theme.primaryColor }}
                                    ></div>
                                    <span className="text-xs text-gray-500">Primary Color</span>
                                </div>
                
                                {activeTheme === theme.id && (
                                    <span className="text-xs font-medium text-blue-600">Active</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 