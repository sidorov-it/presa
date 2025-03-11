import React, { useState, useRef } from 'react';
import { Element } from '@/types';

interface ElementComponentProps {
  element: Element;
  isPreview: boolean;
  onUpdate: (data: Partial<Element>) => void;
  onDelete: () => void;
}

const ElementComponent: React.FC<ElementComponentProps> = ({
  element,
  isPreview,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  
  // Обработчики для перетаскивания элемента
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPreview) return;
    
    e.stopPropagation();
    setIsDragging(true);
    
    const rect = elementRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };
  
  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || isPreview) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    const parentRect = elementRef.current?.parentElement?.getBoundingClientRect();
    if (parentRect) {
      const newX = e.clientX - parentRect.left - dragOffset.x;
      const newY = e.clientY - parentRect.top - dragOffset.y;
      
      onUpdate({
        position: {
          x: Math.max(0, Math.min(newX, parentRect.width - element.size.width)),
          y: Math.max(0, Math.min(newY, parentRect.height - element.size.height)),
        },
      });
    }
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  // Обработчики для изменения размера элемента
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPreview) return;
    
    e.stopPropagation();
    setIsResizing(true);
  };
  
  const handleResizeMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isResizing || isPreview) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    const parentRect = elementRef.current?.parentElement?.getBoundingClientRect();
    const elementRect = elementRef.current?.getBoundingClientRect();
    
    if (parentRect && elementRect) {
      const newWidth = e.clientX - elementRect.left;
      const newHeight = e.clientY - elementRect.top;
      
      onUpdate({
        size: {
          width: Math.max(50, Math.min(newWidth, parentRect.width - element.position.x)),
          height: Math.max(20, Math.min(newHeight, parentRect.height - element.position.y)),
        },
      });
    }
  };
  
  const handleResizeEnd = () => {
    setIsResizing(false);
  };
  
  // Обработчик для двойного клика (редактирование)
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPreview) return;
    
    e.stopPropagation();
    
    // Только для текстовых элементов
    if (
      element.type === 'text' ||
      element.type === 'heading' ||
      element.type === 'paragraph' ||
      element.type === 'button'
    ) {
      setIsEditing(true);
    }
  };
  
  // Обработчик для изменения текста
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (
      element.type === 'text' ||
      element.type === 'heading' ||
      element.type === 'paragraph'
    ) {
      onUpdate({ content: e.target.value });
    } else if (element.type === 'button') {
      onUpdate({ text: e.target.value });
    }
  };
  
  // Обработчик для завершения редактирования
  const handleEditEnd = () => {
    setIsEditing(false);
  };
  
  // Обработчик для удаления элемента
  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDelete();
  };
  
  // Рендер элемента в зависимости от типа
  const renderElement = () => {
    const commonStyles = {
      // position: 'absolute' as const,
      // left: `${element.position.x}px`,
      // top: `${element.position.y}px`,
      width: `${element.size.width}px`,
      height: `${element.size.height}px`,
      zIndex: element.zIndex,
      ...element.style,
    };
    
    switch (element.type) {
      case 'text':
      case 'heading':
      case 'paragraph':
        return (
          <div
            style={commonStyles}
            className={`
              overflow-hidden
              ${element.type === 'heading' ? 'font-bold' : ''}
              ${isEditing ? 'border border-blue-500' : ''}
            `}
          >
            {isEditing ? (
              <textarea
                value={(element as any).content}
                onChange={handleTextChange}
                onBlur={handleEditEnd}
                className="w-full h-full p-0 border-0 resize-none focus:outline-none bg-transparent"
                autoFocus
                style={{ ...element.style }}
                aria-label="Редактирование текста"
              />
            ) : (
              <div className="w-full h-full overflow-hidden">
                {(element as any).content}
              </div>
            )}
          </div>
        );
        
      case 'list':
        const listElement = element as any;
        return (
          <div style={commonStyles} className="overflow-auto">
            {listElement.listType === 'bullet' ? (
              <ul className="list-disc pl-5">
                {listElement.items.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <ol className="list-decimal pl-5">
                {listElement.items.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ol>
            )}
          </div>
        );
        
      case 'image':
        const imageElement = element as any;
        return (
          <div style={commonStyles} className="overflow-hidden">
            <img
              src={imageElement.src}
              alt={imageElement.alt}
              className="w-full h-full object-cover"
            />
          </div>
        );
        
      case 'divider':
        return (
          <div
            style={{
              ...commonStyles,
              height: '2px',
              backgroundColor: element.style.backgroundColor || '#e0e0e0',
            }}
          />
        );
        
      case 'icon':
        const iconElement = element as any;
        return (
          <div
            style={commonStyles}
            className="flex items-center justify-center"
          >
            {/* Здесь будет отображаться иконка по имени */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {iconElement.iconName === 'star' ? (
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              ) : (
                <circle cx="12" cy="12" r="10" />
              )}
            </svg>
          </div>
        );
        
      case 'video':
        const videoElement = element as any;
        return (
          <div style={commonStyles} className="overflow-hidden">
            <iframe
              src={videoElement.src}
              className="w-full h-full"
              allowFullScreen
              title="Embedded video"
              allow={videoElement.autoplay ? 'autoplay' : ''}
              frameBorder="0"
            />
          </div>
        );
        
      case 'chart':
        return (
          <div style={commonStyles} className="bg-white p-2 rounded">
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Диаграмма (заглушка)
            </div>
          </div>
        );
        
      case 'button':
        const buttonElement = element as any;
        return (
          <div style={commonStyles}>
            {isEditing ? (
              <textarea
                value={buttonElement.text}
                onChange={handleTextChange}
                onBlur={handleEditEnd}
                className="w-full h-full p-0 border-0 resize-none focus:outline-none bg-transparent text-center"
                autoFocus
                style={{ ...element.style }}
                aria-label="Редактирование текста кнопки"
              />
            ) : (
              <button
                className="w-full h-full flex items-center justify-center"
                style={{ ...element.style }}
                disabled={isPreview}
                aria-label={buttonElement.text}
              >
                {buttonElement.text}
              </button>
            )}
          </div>
        );
        
      default:
        return <div style={commonStyles}>Неизвестный элемент</div>;
    }
  };
  
  // Эффекты для обработки перетаскивания и изменения размера на уровне документа
  React.useEffect(() => {
    if (isDragging || isResizing) {
      const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          handleDragMove(e as unknown as React.MouseEvent<HTMLDivElement>);
        } else if (isResizing) {
          handleResizeMove(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      };
      
      const handleMouseUp = () => {
        if (isDragging) {
          handleDragEnd();
        } else if (isResizing) {
          handleResizeEnd();
        }
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);
  
  return (
    <div
      ref={elementRef}
      className={`
        absolute
        ${!isPreview ? 'hover:outline hover:outline-1 hover:outline-blue-300' : ''}
        ${isDragging || isResizing ? 'outline outline-2 outline-blue-500' : ''}
      `}
      style={{
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.size.width}px`,
        height: `${element.size.height}px`,
        zIndex: element.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleDragStart}
      onDoubleClick={handleDoubleClick}
      tabIndex={isPreview ? -1 : 0}
      aria-label={`Элемент: ${element.type}`}
      onKeyDown={(e) => {
        if (!isPreview && (e.key === 'Delete' || e.key === 'Backspace')) {
          e.preventDefault();
          onDelete();
        }
      }}
    >
      {renderElement()}
      
      {/* Кнопки управления элементом (видны только в режиме редактирования) */}
      {!isPreview && !isEditing && (
        <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 text-gray-500 hover:text-red-600 rounded-full"
            onClick={handleDelete}
            aria-label="Удалить элемент"
            tabIndex={0}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Маркер изменения размера (виден только в режиме редактирования) */}
      {!isPreview && !isEditing && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-tl-sm cursor-se-resize"
          onMouseDown={handleResizeStart}
          aria-label="Изменить размер элемента"
          tabIndex={-1}
        />
      )}
    </div>
  );
};

export default ElementComponent;