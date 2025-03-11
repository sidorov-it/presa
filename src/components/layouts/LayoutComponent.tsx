import React, { useState } from 'react';
import { Layout, Element } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import ElementComponent from '../elements/ElementComponent';

interface LayoutComponentProps {
  layout: Layout;
  presentationId: string;
  slideId: string;
  isSelected: boolean;
  isPreview: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const LayoutComponent: React.FC<LayoutComponentProps> = ({
  layout,
  presentationId,
  slideId,
  isSelected,
  isPreview,
  onSelect,
  onDelete,
}) => {
  const { updateLayout, deleteLayout, addElement, updateElement, deleteElement } = usePresentationStore();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // Обработчики для drag-and-drop
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
      
      if (data.type === 'element') {
        const elementType = data.elementType;
        
        // Получаем координаты относительно макета
        const layoutRect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - layoutRect.left;
        const y = e.clientY - layoutRect.top;
        
        // Создаем новый элемент в зависимости от типа
        let newElement: Omit<Element, 'id'>;
        
        switch (elementType) {
          case 'text':
            newElement = {
              type: 'text',
              content: 'Двойной клик для редактирования текста',
              position: { x, y },
              size: { width: 200, height: 50 },
              style: { fontSize: '16px', color: '#333333' },
              zIndex: layout.elements.length + 1,
            };
            break;
            
          case 'heading':
            newElement = {
              type: 'heading',
              content: 'Заголовок',
              position: { x, y },
              size: { width: 300, height: 60 },
              style: { fontSize: '24px', fontWeight: 'bold', color: '#111111' },
              zIndex: layout.elements.length + 1,
            };
            break;
            
          case 'paragraph':
            newElement = {
              type: 'paragraph',
              content: 'Это параграф текста. Двойной клик для редактирования содержимого.',
              position: { x, y },
              size: { width: 300, height: 100 },
              style: { fontSize: '16px', color: '#333333' },
              zIndex: layout.elements.length + 1,
            };
            break;
            
          case 'list':
            newElement = {
              type: 'list',
              items: ['Первый пункт', 'Второй пункт', 'Третий пункт'],
              listType: 'bullet',
              position: { x, y },
              size: { width: 300, height: 120 },
              style: { fontSize: '16px', color: '#333333' },
              zIndex: layout.elements.length + 1,
            };
            break;
            
          case 'image':
            newElement = {
              type: 'image',
              src: 'https://via.placeholder.com/300x200',
              alt: 'Изображение',
              position: { x, y },
              size: { width: 300, height: 200 },
              style: { borderRadius: '4px' },
              zIndex: layout.elements.length + 1,
            };
            break;
            
          case 'divider':
            newElement = {
              type: 'divider',
              position: { x, y },
              size: { width: 300, height: 2 },
              style: { backgroundColor: '#e0e0e0' },
              zIndex: layout.elements.length + 1,
            };
            break;
            
          case 'icon':
            newElement = {
              type: 'icon',
              iconName: 'star',
              position: { x, y },
              size: { width: 48, height: 48 },
              style: { color: '#4a5568' },
              zIndex: layout.elements.length + 1,
            };
            break;
            
          case 'video':
            newElement = {
              type: 'video',
              src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              autoplay: false,
              controls: true,
              position: { x, y },
              size: { width: 400, height: 225 },
              style: { borderRadius: '4px' },
              zIndex: layout.elements.length + 1,
            };
            break;
            
          case 'chart':
            newElement = {
              type: 'chart',
              chartType: 'bar',
              data: {
                labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май'],
                datasets: [
                  {
                    label: 'Данные',
                    data: [12, 19, 3, 5, 2],
                    backgroundColor: '#4299e1',
                  },
                ],
              },
              position: { x, y },
              size: { width: 400, height: 300 },
              style: { backgroundColor: '#ffffff', borderRadius: '4px' },
              zIndex: layout.elements.length + 1,
            };
            break;
            
          case 'button':
            newElement = {
              type: 'button',
              text: 'Кнопка',
              action: {
                type: 'link',
                target: 'https://example.com',
              },
              position: { x, y },
              size: { width: 120, height: 40 },
              style: {
                backgroundColor: '#4299e1',
                color: '#ffffff',
                borderRadius: '4px',
                fontWeight: 'bold',
              },
              zIndex: layout.elements.length + 1,
            };
            break;
            
          default:
            return;
        }
        
        // Добавляем элемент в макет
        addElement(presentationId, slideId, layout.id, newElement);
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };
  
  // Обработчик для выбора макета
  const handleLayoutClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPreview) {
      e.stopPropagation();
      onSelect();
    }
  };
  
  // Обработчик для удаления макета
  const handleDeleteLayout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    deleteLayout(presentationId, slideId, layout.id);
    onDelete();
  };
  
  // Обработчик для обновления элемента
  const handleElementUpdate = (elementId: string, data: Partial<Element>) => {
    updateElement(presentationId, slideId, layout.id, elementId, data);
  };
  
  // Обработчик для удаления элемента
  const handleElementDelete = (elementId: string) => {
    deleteElement(presentationId, slideId, layout.id, elementId);
  };
  
  // Определяем стили макета в зависимости от типа
  const getLayoutStyles = () => {
    const baseStyles = {
      ...layout.style,
      position: 'relative' as const,
      width: '100%',
      height: '100%',
    };
    
    switch (layout.type) {
      case 'single-column':
        return {
          ...baseStyles,
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        };
        
      case 'two-columns':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          padding: '20px',
        };
        
      case 'three-columns':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
          padding: '20px',
        };
        
      case 'four-columns':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '15px',
          padding: '20px',
        };
        
      case 'image-text':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          padding: '20px',
        };
        
      case 'text-image':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          padding: '20px',
        };
        
      case 'cards':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          padding: '20px',
        };
        
      case 'icons-with-text':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '20px',
          padding: '20px',
        };
        
      case 'blank':
      default:
        return baseStyles;
    }
  };
  
  return (
    <div
      className={`
        relative
        ${isSelected && !isPreview ? 'outline outline-2 outline-blue-500' : ''}
        ${isDraggingOver ? 'bg-blue-50' : ''}
      `}
      style={getLayoutStyles()}
      onClick={handleLayoutClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      tabIndex={0}
      aria-label={`Макет: ${layout.type}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleLayoutClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }}
    >
      {/* Элементы макета */}
      {layout.elements.map((element) => (
        <ElementComponent
          key={element.id}
          element={element}
          isPreview={isPreview}
          onUpdate={(data) => handleElementUpdate(element.id, data)}
          onDelete={() => handleElementDelete(element.id)}
        />
      ))}
      
      {/* Кнопки управления макетом (видны только в режиме редактирования и при выборе) */}
      {isSelected && !isPreview && (
        <div className="absolute top-2 right-2 flex space-x-1 bg-white rounded-md shadow-sm p-1">
          <button
            className="p-1 text-gray-500 hover:text-red-600 rounded"
            onClick={handleDeleteLayout}
            aria-label="Удалить макет"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDeleteLayout(e as unknown as React.MouseEvent<HTMLButtonElement>);
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Подсказка для пустого макета */}
      {layout.elements.length === 0 && !isPreview && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
          <p className="text-sm">Перетащите элементы сюда</p>
        </div>
      )}
    </div>
  );
};

export default LayoutComponent; 