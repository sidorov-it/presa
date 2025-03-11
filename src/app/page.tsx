'use client';

import React, { useState } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import Editor from '@/components/editor/Editor';
import Button from '@/components/ui/Button';

export default function Home() {
  const { presentations, createPresentation } = usePresentationStore();
  const [selectedPresentationId, setSelectedPresentationId] = useState<string | null>(null);
  
  // Обработчик создания новой презентации
  const handleCreatePresentation = () => {
    createPresentation('Новая презентация');
    // Выбираем последнюю созданную презентацию
    if (presentations.length > 0) {
      setSelectedPresentationId(presentations[presentations.length - 1].id);
    }
  };
  
  // Если выбрана презентация, показываем редактор
  if (selectedPresentationId) {
    return <Editor presentationId={selectedPresentationId} />;
  }
  
  // Иначе показываем список презентаций или предложение создать новую
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-blue-600">Presa - Создание презентаций с помощью ИИ</h1>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Создавайте потрясающие презентации</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Используйте искусственный интеллект для генерации слайдов, редактируйте их вручную и экспортируйте в различные форматы.
          </p>
        </div>
        
        <div className="flex justify-center mb-8">
          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleCreatePresentation}
          >
            Создать новую презентацию
          </Button>
        </div>
        
        {presentations.length > 0 && (
          <div>
            <h3 className="text-xl font-medium mb-4">Ваши презентации</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presentations.map((presentation) => (
                <div 
                  key={presentation.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedPresentationId(presentation.id)}
                  tabIndex={0}
                  aria-label={`Открыть презентацию ${presentation.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedPresentationId(presentation.id);
                    }
                  }}
                >
                  <div className="h-40 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Предпросмотр</span>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-medium mb-1">{presentation.title}</h4>
                    <p className="text-sm text-gray-500">
                      {presentation.slides.length} слайдов • {new Date(presentation.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">Presa</h2>
              <p className="text-gray-400">Создание презентаций с помощью ИИ</p>
            </div>
            
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">О нас</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Контакты</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Помощь</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
