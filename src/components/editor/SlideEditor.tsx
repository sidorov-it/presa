import React, { useState, useRef, useEffect } from 'react';
import { Slide, Element, Layout } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import LayoutComponent from '@/components/layouts/LayoutComponent';

interface SlideEditorProps {
  slide: Slide;
  presentationId: string;
  isPreview?: boolean;
}

const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  presentationId,
  isPreview = false,
}) => {
  const { updateSlide, updateLayout, addLayout } = usePresentationStore();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (slide.layouts.length > 0 && !selectedLayoutId) {
      setSelectedLayoutId(slide.layouts[0].id);
    }
  }, [slide.layouts, selectedLayoutId]);
  
  const handleUpdateSlideTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSlide(presentationId, slide.id, { title: e.target.value });
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'layout') {
        const layoutType = data.layoutType;
        const newLayoutId = addLayout(presentationId, slide.id, layoutType);
        setSelectedLayoutId(newLayoutId);
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };
  
  const handleLayoutSelect = (layoutId: string) => {
    if (!isPreview) {
      setSelectedLayoutId(layoutId);
    }
  };
  
  const handleLayoutDelete = (layoutId: string) => {
    // Удаление макета реализовано в компоненте макета
    
    // После удаления, если это был выбранный макет, сбрасываем выбор
    if (selectedLayoutId === layoutId) {
      setSelectedLayoutId(null);
    }
  };
  
  // Функция для обновления размеров и позиций элементов внутри макета
  const handleElementUpdate = (layoutId: string, elementId: string, data: Partial<Element>) => {
    // Логика обновления элемента реализована в компоненте макета
  };
  
  // Рассчитываем фон слайда
  const slideBackground = slide.background.type === 'color'
    ? { backgroundColor: slide.background.value }
    : { backgroundImage: `url(${slide.background.value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    
  return (
    <div className="h-full flex flex-col p-6">
      {!isPreview && (
        <div className="mb-4">
          <input
            type="text"
            value={slide.title}
            onChange={handleUpdateSlideTitle}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Название слайда"
            aria-label="Название слайда"
          />
        </div>
      )}
      
      <div
        ref={editorRef}
        className={`
          flex-1 
          bg-gray-100 
          rounded-lg 
          shadow-inner 
          overflow-hidden 
          relative
          flex 
          items-center 
          justify-center
          transition-all
          ${isDraggingOver ? 'border-2 border-dashed border-blue-400' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className="w-full h-full max-w-4xl mx-auto aspect-[16/9] shadow-md"
          style={{
            ...slideBackground,
            ...slide.style,
          }}
        >
          {slide.layouts.length > 0 ? (
            slide.layouts.map((layout) => (
              <LayoutComponent
                key={layout.id}
                layout={layout}
                presentationId={presentationId}
                slideId={slide.id}
                isSelected={layout.id === selectedLayoutId}
                isPreview={isPreview}
                onSelect={() => handleLayoutSelect(layout.id)}
                onDelete={() => handleLayoutDelete(layout.id)}
              />
            ))
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-gray-400">
              {isPreview ? (
                <p>Пустой слайд</p>
              ) : (
                <>
                  <p className="text-lg mb-2">Перетащите макет сюда</p>
                  <p className="text-sm">или выберите макет из списка справа</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlideEditor; 