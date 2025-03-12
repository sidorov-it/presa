import React, { useState, useEffect, useRef } from 'react';
import { Layout, Element, TextElement, ListElement, ImageElement, IconElement, VideoElement, ChartElement, ButtonElement, DividerElement } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import ElementComponent from '../elements/ElementComponent';

interface LayoutComponentProps {
  layout: Layout;
  presentationId: string;
  slideId: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const LayoutComponent: React.FC<LayoutComponentProps> = ({
  layout,
  presentationId,
  slideId,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const { updateLayout, deleteLayout, addElement, updateElement, deleteElement } = usePresentationStore();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const elementsAddedRef = useRef(false);
  
  // Добавляем эффект для автоматического создания элементов при создании макета
  useEffect(() => {
    // Проверяем, что элементы еще не были добавлены и макет пустой
    if (!elementsAddedRef.current && layout.elements.length === 0) {
      elementsAddedRef.current = true;
      addDefaultElements();
    }
  }, [layout.id]);
  
  // Функция для добавления элементов по умолчанию в зависимости от типа макета
  const addDefaultElements = () => {
    switch (layout.type) {
      case 'single-column': {
        // Создаем элемент заголовка с правильным типом
        const headingElement: Omit<TextElement, 'id'> = {
          type: 'heading',
          content: 'Заголовок',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 60 },
          style: { fontSize: '24px', fontWeight: 'bold', color: '#111111', textAlign: 'center' },
          zIndex: 1,
        };
        addElement(presentationId, slideId, layout.id, headingElement);
        
        // Создаем элемент параграфа с правильным типом
        const paragraphElement: Omit<TextElement, 'id'> = {
          type: 'paragraph',
          content: 'Это параграф текста. Двойной клик для редактирования содержимого.',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          style: { fontSize: '16px', color: '#333333', textAlign: 'center' },
          zIndex: 2,
        };
        addElement(presentationId, slideId, layout.id, paragraphElement);
        break;
      }
        
      case 'two-columns': {
        // Левая колонка - текст
        const leftHeadingElement: Omit<TextElement, 'id'> = {
          type: 'heading',
          content: 'Заголовок',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 60 },
          style: { fontSize: '24px', fontWeight: 'bold', color: '#111111' },
          zIndex: 1,
          gridArea: 'left',
        };
        addElement(presentationId, slideId, layout.id, leftHeadingElement);
        
        const leftParagraphElement: Omit<TextElement, 'id'> = {
          type: 'paragraph',
          content: 'Это параграф текста. Двойной клик для редактирования содержимого.',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          style: { fontSize: '16px', color: '#333333' },
          zIndex: 2,
          gridArea: 'left',
        };
        addElement(presentationId, slideId, layout.id, leftParagraphElement);
        
        // Правая колонка - текст
        const rightParagraphElement: Omit<TextElement, 'id'> = {
          type: 'paragraph',
          content: 'Вторая колонка с текстом. Двойной клик для редактирования.',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          style: { fontSize: '16px', color: '#333333' },
          zIndex: 3,
          gridArea: 'right',
        };
        addElement(presentationId, slideId, layout.id, rightParagraphElement);
        break;
      }
        
      case 'three-columns': {
        // Добавляем три параграфа
        for (let i = 0; i < 3; i++) {
          const columnElement: Omit<TextElement, 'id'> = {
            type: 'paragraph',
            content: `Колонка ${i + 1}. Двойной клик для редактирования.`,
            position: { x: 0, y: 0 },
            size: { width: 100, height: 100 },
            style: { fontSize: '16px', color: '#333333', textAlign: 'center' },
            zIndex: i + 1,
            gridArea: `col${i + 1}`,
          };
          addElement(presentationId, slideId, layout.id, columnElement);
        }
        break;
      }
        
      case 'image-text': {
        // Изображение
        const imageElement: Omit<ImageElement, 'id'> = {
          type: 'image',
          src: 'https://via.placeholder.com/600x400',
          alt: 'Изображение',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          style: {},
          zIndex: 1,
          gridArea: 'image',
        };
        addElement(presentationId, slideId, layout.id, imageElement);
        
        // Текст
        const headingElement: Omit<TextElement, 'id'> = {
          type: 'heading',
          content: 'Заголовок',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 60 },
          style: { fontSize: '24px', fontWeight: 'bold', color: '#111111' },
          zIndex: 2,
          gridArea: 'text',
        };
        addElement(presentationId, slideId, layout.id, headingElement);
        
        const paragraphElement: Omit<TextElement, 'id'> = {
          type: 'paragraph',
          content: 'Описание изображения. Двойной клик для редактирования.',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          style: { fontSize: '16px', color: '#333333' },
          zIndex: 3,
          gridArea: 'text',
        };
        addElement(presentationId, slideId, layout.id, paragraphElement);
        break;
      }
        
      case 'text-image': {
        // Текст
        const headingElement: Omit<TextElement, 'id'> = {
          type: 'heading',
          content: 'Заголовок',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 60 },
          style: { fontSize: '24px', fontWeight: 'bold', color: '#111111' },
          zIndex: 1,
          gridArea: 'text',
        };
        addElement(presentationId, slideId, layout.id, headingElement);
        
        const paragraphElement: Omit<TextElement, 'id'> = {
          type: 'paragraph',
          content: 'Описание изображения. Двойной клик для редактирования.',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          style: { fontSize: '16px', color: '#333333' },
          zIndex: 2,
          gridArea: 'text',
        };
        addElement(presentationId, slideId, layout.id, paragraphElement);
        
        // Изображение
        const imageElement: Omit<ImageElement, 'id'> = {
          type: 'image',
          src: 'https://via.placeholder.com/600x400',
          alt: 'Изображение',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          style: {},
          zIndex: 3,
          gridArea: 'image',
        };
        addElement(presentationId, slideId, layout.id, imageElement);
        break;
      }
        
      case 'icons-with-text': {
        // Добавляем 3 иконки с текстом
        for (let i = 0; i < 3; i++) {
          const iconElement: Omit<IconElement, 'id'> = {
            type: 'icon',
            iconName: 'star',
            position: { x: 0, y: 0 },
            size: { width: 48, height: 48 },
            style: { color: '#4a5568' },
            zIndex: i * 2 + 1,
            gridArea: `icon${i + 1}`,
          };
          addElement(presentationId, slideId, layout.id, iconElement);
          
          const textElement: Omit<TextElement, 'id'> = {
            type: 'paragraph',
            content: `Описание ${i + 1}`,
            position: { x: 0, y: 0 },
            size: { width: 100, height: 40 },
            style: { fontSize: '14px', color: '#333333', textAlign: 'center' },
            zIndex: i * 2 + 2,
            gridArea: `text${i + 1}`,
          };
          addElement(presentationId, slideId, layout.id, textElement);
        }
        break;
      }
        
      case 'cards': {
        // Добавляем 3 карточки
        for (let i = 0; i < 3; i++) {
          const headingElement: Omit<TextElement, 'id'> = {
            type: 'heading',
            content: `Карточка ${i + 1}`,
            position: { x: 0, y: 0 },
            size: { width: 100, height: 40 },
            style: { fontSize: '18px', fontWeight: 'bold', color: '#111111', textAlign: 'center' },
            zIndex: i * 2 + 1,
            gridArea: `card${i + 1}`,
          };
          addElement(presentationId, slideId, layout.id, headingElement);
          
          const paragraphElement: Omit<TextElement, 'id'> = {
            type: 'paragraph',
            content: 'Описание карточки',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 60 },
            style: { fontSize: '14px', color: '#333333', textAlign: 'center' },
            zIndex: i * 2 + 2,
            gridArea: `card${i + 1}`,
          };
          addElement(presentationId, slideId, layout.id, paragraphElement);
        }
        break;
      }
        
      case 'blank':
      default:
        // Для пустого макета не добавляем элементы
        break;
    }
  };
  
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
        
        // Определяем, в какую область макета попал элемент
        let gridArea = 'default';
        
        // Для макетов с колонками определяем, в какую колонку попал элемент
        if (layout.type === 'two-columns') {
          gridArea = x < layoutRect.width / 2 ? 'left' : 'right';
        } else if (layout.type === 'three-columns') {
          const colWidth = layoutRect.width / 3;
          if (x < colWidth) {
            gridArea = 'col1';
          } else if (x < colWidth * 2) {
            gridArea = 'col2';
          } else {
            gridArea = 'col3';
          }
        } else if (layout.type === 'image-text') {
          gridArea = x < layoutRect.width / 2 ? 'image' : 'text';
        } else if (layout.type === 'text-image') {
          gridArea = x < layoutRect.width / 2 ? 'text' : 'image';
        }
        
        // Создаем новый элемент в зависимости от типа
        let newElement: Omit<Element, 'id'>;
        
        switch (elementType) {
          case 'text': {
            const textElement: Omit<TextElement, 'id'> = {
              type: 'text',
              content: 'Двойной клик для редактирования текста',
              position: { x: 0, y: 0 },
              size: { width: 200, height: 50 },
              style: { fontSize: '16px', color: '#333333' },
              zIndex: layout.elements.length + 1,
              gridArea,
            };
            newElement = textElement;
            break;
          }
            
          case 'heading': {
            const headingElement: Omit<TextElement, 'id'> = {
              type: 'heading',
              content: 'Заголовок',
              position: { x: 0, y: 0 },
              size: { width: 300, height: 60 },
              style: { fontSize: '24px', fontWeight: 'bold', color: '#111111' },
              zIndex: layout.elements.length + 1,
              gridArea,
            };
            newElement = headingElement;
            break;
          }
            
          case 'paragraph': {
            const paragraphElement: Omit<TextElement, 'id'> = {
              type: 'paragraph',
              content: 'Это параграф текста. Двойной клик для редактирования содержимого.',
              position: { x: 0, y: 0 },
              size: { width: 300, height: 100 },
              style: { fontSize: '16px', color: '#333333' },
              zIndex: layout.elements.length + 1,
              gridArea,
            };
            newElement = paragraphElement;
            break;
          }
            
          case 'list': {
            const listElement: Omit<ListElement, 'id'> = {
              type: 'list',
              items: ['Первый пункт', 'Второй пункт', 'Третий пункт'],
              listType: 'bullet',
              position: { x: 0, y: 0 },
              size: { width: 300, height: 120 },
              style: { fontSize: '16px', color: '#333333' },
              zIndex: layout.elements.length + 1,
              gridArea,
            };
            newElement = listElement;
            break;
          }
            
          case 'image': {
            const imageElement: Omit<ImageElement, 'id'> = {
              type: 'image',
              src: 'https://via.placeholder.com/300x200',
              alt: 'Изображение',
              position: { x: 0, y: 0 },
              size: { width: 300, height: 200 },
              style: { borderRadius: '4px' },
              zIndex: layout.elements.length + 1,
              gridArea,
            };
            newElement = imageElement;
            break;
          }
            
          case 'divider': {
            const dividerElement: Omit<DividerElement, 'id'> = {
              type: 'divider',
              position: { x: 0, y: 0 },
              size: { width: 300, height: 2 },
              style: { backgroundColor: '#e0e0e0' },
              zIndex: layout.elements.length + 1,
              gridArea,
            };
            newElement = dividerElement;
            break;
          }
            
          case 'icon': {
            const iconElement: Omit<IconElement, 'id'> = {
              type: 'icon',
              iconName: 'star',
              position: { x: 0, y: 0 },
              size: { width: 48, height: 48 },
              style: { color: '#4a5568' },
              zIndex: layout.elements.length + 1,
              gridArea,
            };
            newElement = iconElement;
            break;
          }
            
          case 'video': {
            const videoElement: Omit<VideoElement, 'id'> = {
              type: 'video',
              src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              autoplay: false,
              controls: true,
              position: { x: 0, y: 0 },
              size: { width: 400, height: 225 },
              style: { borderRadius: '4px' },
              zIndex: layout.elements.length + 1,
              gridArea,
            };
            newElement = videoElement;
            break;
          }
            
          case 'chart': {
            const chartElement: Omit<ChartElement, 'id'> = {
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
              position: { x: 0, y: 0 },
              size: { width: 400, height: 300 },
              style: { backgroundColor: '#ffffff', borderRadius: '4px' },
              zIndex: layout.elements.length + 1,
              gridArea,
            };
            newElement = chartElement;
            break;
          }
            
          case 'button': {
            const buttonElement: Omit<ButtonElement, 'id'> = {
              type: 'button',
              text: 'Кнопка',
              action: {
                type: 'link',
                target: 'https://example.com',
              },
              position: { x: 0, y: 0 },
              size: { width: 120, height: 40 },
              style: {
                backgroundColor: '#4299e1',
                color: '#ffffff',
                borderRadius: '4px',
                fontWeight: 'bold',
              },
              zIndex: layout.elements.length + 1,
              gridArea,
            };
            newElement = buttonElement;
            break;
          }
            
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
    e.stopPropagation();
    onSelect();
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
  
  // Определяем стили и структуру макета в зависимости от типа
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
          gridTemplateAreas: '"left right"',
          gap: '20px',
          padding: '20px',
        };
        
      case 'three-columns':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateAreas: '"col1 col2 col3"',
          gap: '20px',
          padding: '20px',
        };
        
      case 'four-columns':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gridTemplateAreas: '"col1 col2 col3 col4"',
          gap: '15px',
          padding: '20px',
        };
        
      case 'image-text':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateAreas: '"image text"',
          gap: '20px',
          padding: '20px',
        };
        
      case 'text-image':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateAreas: '"text image"',
          gap: '20px',
          padding: '20px',
        };
        
      case 'cards':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gridTemplateAreas: '"card1 card2" "card3 card4"',
          gap: '20px',
          padding: '20px',
        };
        
      case 'icons-with-text':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateAreas: '"icon1 icon2 icon3 icon4"',
          gap: '20px',
          padding: '20px',
        };
        
      case 'blank':
      default:
        return baseStyles;
    }
  };
  
  // Группируем элементы по областям сетки
  const getElementsByGridArea = () => {
    const elementsByArea: Record<string, Element[]> = {};
    
    layout.elements.forEach((element) => {
      const area = (element as any).gridArea || 'default';
      if (!elementsByArea[area]) {
        elementsByArea[area] = [];
      }
      elementsByArea[area].push(element);
    });
    
    return elementsByArea;
  };
  
  // Рендерим элементы в соответствии с их областями сетки
  const renderElements = () => {
    const elementsByArea = getElementsByGridArea();
    
    // Для макетов с сеткой рендерим элементы по областям
    if (layout.type !== 'blank') {
      return Object.entries(elementsByArea).map(([area, elements]) => (
        <div 
          key={area} 
          className="flex flex-col items-center justify-center h-full"
          style={{ gridArea: area }}
        >
          {elements.map((element) => (
            <ElementComponent
              key={element.id}
              element={element}
              onUpdate={(data) => handleElementUpdate(element.id, data)}
              onDelete={() => handleElementDelete(element.id)}
            />
          ))}
        </div>
      ));
    }
    
    // Для пустого макета просто рендерим элементы
    return layout.elements.map((element) => (
      <ElementComponent
        key={element.id}
        element={element}
        onUpdate={(data) => handleElementUpdate(element.id, data)}
        onDelete={() => handleElementDelete(element.id)}
      />
    ));
  };
  
  return (
    <div
      className={`
        relative
        ${isSelected ? 'outline outline-2 outline-blue-500' : ''}
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
      {/* Рендерим элементы макета */}
      {renderElements()}
      
      {/* Кнопки управления макетом (видны только в режиме редактирования и при выборе) */}
      {isSelected && (
        <div className="absolute top-2 right-2 flex space-x-1 bg-white rounded-md shadow-sm p-1 z-50">
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
      
      {/* Подсказка для пустого макета не нужна, так как теперь используем текстовый ввод */}
      {/* {layout.elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
          <p className="text-sm">Нажмите для добавления контента</p>
        </div>
      )} */}
    </div>
  );
};

export default LayoutComponent; 