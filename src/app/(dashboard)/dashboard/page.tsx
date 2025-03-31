'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
import { FaPlus, FaMagic, FaEllipsisV } from 'react-icons/fa';
import { IPresentation } from '@/types';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { presentations, createPresentation } = usePresentationStore();
  const [showAIModal, setShowAIModal] = useState(false);
  const [userPresentations, setUserPresentations] = useState<IPresentation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // AI form state
  const [aiPrompt, setAiPrompt] = useState('');
  const [numSlides, setNumSlides] = useState(5);
  const [language, setLanguage] = useState('en');
  const [aiError, setAiError] = useState('');
  
  // Fetch user's presentations from the database
  useEffect(() => {
    const loadPresentations = async () => {
      if (session?.user?.id) {
        try {
          // This would be a real API call in production
          // For now, use the local store
          setUserPresentations(presentations);
        } catch (error) {
          console.error('Failed to load presentations:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadPresentations();
  }, [session, presentations]);

  // Handle creating an empty presentation
  const handleCreateEmptyPresentation = () => {
    const presentationId = createPresentation('New Presentation');
    router.push(`/docs/${presentationId}`);
  };
  
  // Handle opening the AI modal
  const handleCreateWithAI = () => {
    setShowAIModal(true);
  };

  // Handle opening a presentation
  const handleOpenPresentation = (presentationId: string) => {
    router.push(`/docs/${presentationId}`);
  };

  // Handle submitting the AI form
  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aiPrompt.trim()) {
      setAiError('Please enter a prompt');
      return;
    }
    
    try {
      setIsGenerating(true);
      setAiError('');
      
      const response = await fetch('/api/presentations/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          numSlides,
          language,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create presentation');
      }
      
      // Close modal and navigate to the new presentation
      setShowAIModal(false);
      router.push(`/docs/${data.presentationId}`);
    } catch (error) {
      console.error('AI generation error:', error);
      setAiError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fill the example prompt
  const handleExampleClick = (example: string) => {
    setAiPrompt(example);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Presentations</h1>
        <div className="mt-4 md:mt-0 space-x-4 flex">
          <button
            onClick={handleCreateWithAI}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaMagic className="mr-2" />
            Create with AI
          </button>
          <button
            onClick={handleCreateEmptyPresentation}
            className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
          >
            <FaPlus className="mr-2" />
            Create Empty
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : presentations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">You haven't created any presentations yet</h2>
          <p className="text-gray-500 mb-6">Create your first presentation to get started</p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleCreateWithAI}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              <FaMagic className="mr-2" />
              Create with AI
            </button>
            <button
              onClick={handleCreateEmptyPresentation}
              className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors w-full sm:w-auto"
            >
              <FaPlus className="mr-2" />
              Create Empty
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentations.map((presentation) => (
            <div 
              key={presentation.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div 
                className="h-40 bg-gray-200 flex items-center justify-center cursor-pointer"
                onClick={() => handleOpenPresentation(presentation.id)}
              >
                <span className="text-gray-500">Preview</span>
              </div>
              
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 
                    className="font-medium text-lg cursor-pointer hover:text-blue-600"
                    onClick={() => handleOpenPresentation(presentation.id)}
                  >
                    {presentation.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {presentation.slides.length} slides • {new Date(presentation.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="relative">
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <FaEllipsisV />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Creation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Presentation with AI</h2>
            
            <form className="space-y-4" onSubmit={handleAISubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of slides
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={numSlides}
                  onChange={(e) => setNumSlides(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="ru">Russian</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter your prompt
                </label>
                <textarea 
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what you want in your presentation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              {aiError && (
                <div className="text-red-500 text-sm">{aiError}</div>
              )}
              
              <div>
                <p className="text-sm text-gray-700 mb-2">Examples:</p>
                <div className="space-y-2">
                  <button 
                    type="button" 
                    className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                    onClick={() => handleExampleClick("A presentation about climate change and its effects")}
                  >
                    A presentation about climate change and its effects
                  </button>
                  <button 
                    type="button" 
                    className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                    onClick={() => handleExampleClick("Quarterly business review for a tech startup")}
                  >
                    Quarterly business review for a tech startup
                  </button>
                  <button 
                    type="button" 
                    className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                    onClick={() => handleExampleClick("Educational slides about the solar system for children")}
                  >
                    Educational slides about the solar system for children
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAIModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isGenerating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 