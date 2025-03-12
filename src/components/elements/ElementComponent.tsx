import React, { useState, useRef, useEffect } from 'react';
import { Element } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';

interface ElementComponentProps {
  element: Element;
  onUpdate: (data: Partial<Element>) => void;
  onDelete: () => void;
}

const ElementComponent: React.FC<ElementComponentProps> = ({
  element,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editItems, setEditItems] = useState<string[]>([]);
  const elementRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ width: 0, height: 0 });
  const startElementPosRef = useRef({ x: 0, y: 0 });

  // Обработчики для перетаскивания
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditing) return;
    e.stopPropagation();
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startElementPosRef.current = { ...element.position };
    
    // Добавляем обработчики событий на документ
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Вычисляем новую позицию
    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;
    
    // Обновляем позицию элемента
    onUpdate({
      position: {
        x: startElementPosRef.current.x + deltaX,
        y: startElementPosRef.current.y + deltaY,
      },
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    
    // Удаляем обработчики событий с документа
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  // Обработчики для изменения размера
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditing) return;
    e.stopPropagation();
    setIsResizing(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startSizeRef.current = { ...element.size };
    
    // Добавляем обработчики событий на документ
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    // Вычисляем новый размер
    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;
    
    // Обновляем размер элемента
    onUpdate({
      size: {
        width: Math.max(50, startSizeRef.current.width + deltaX),
        height: Math.max(30, startSizeRef.current.height + deltaY),
      },
    });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    
    // Удаляем обработчики событий с документа
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Обработчик для двойного клика (начало редактирования)
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    if (element.type === 'text' || element.type === 'heading' || element.type === 'paragraph') {
      setEditContent(element.content);
      setIsEditing(true);
    } else if (element.type === 'list') {
      setEditItems([...element.items]);
      setIsEditing(true);
    }
  };

  // Обработчик для сохранения изменений
  const handleSaveEdit = () => {
    if (element.type === 'text' || element.type === 'heading' || element.type === 'paragraph') {
      onUpdate({ content: editContent });
    } else if (element.type === 'list') {
      onUpdate({ items: editItems });
    }
    
    setIsEditing(false);
  };

  // Обработчик для отмены редактирования
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Обработчик для изменения текста
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
  };

  // Обработчик для изменения элемента списка
  const handleItemChange = (index: number, value: string) => {
    const newItems = [...editItems];
    newItems[index] = value;
    setEditItems(newItems);
  };

  // Обработчик для добавления элемента списка
  const handleAddItem = () => {
    setEditItems([...editItems, '']);
  };

  // Обработчик для удаления элемента списка
  const handleRemoveItem = (index: number) => {
    const newItems = [...editItems];
    newItems.splice(index, 1);
    setEditItems(newItems);
  };

  // Обработчик для удаления элемента
  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDelete();
  };

  // Получаем стили элемента
  const getElementStyles = () => {
    // Базовые стили для всех элементов
    const baseStyles: React.CSSProperties = {
      ...element.style,
      width: '100%',
      height: '100%',
      position: 'relative',
      cursor: 'move',
      transition: 'box-shadow 0.2s ease',
      boxShadow: isDragging || isResizing ? '0 0 0 2px #3b82f6' : 'none',
    };

    return baseStyles;
  };

  // Рендерим содержимое элемента в зависимости от его типа
  const renderElementContent = () => {
    if (isEditing) {
      // Рендерим редактор для текстовых элементов
      if (element.type === 'text' || element.type === 'heading' || element.type === 'paragraph') {
        return (
          <div className="w-full h-full flex flex-col">
            <textarea
              className="w-full h-full p-2 border border-blue-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={editContent}
              onChange={handleContentChange}
              autoFocus
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                onClick={handleCancelEdit}
              >
                Отмена
              </button>
              <button
                className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                onClick={handleSaveEdit}
              >
                Сохранить
              </button>
            </div>
          </div>
        );
      }
      
      // Рендерим редактор для списков
      if (element.type === 'list') {
        return (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              {editItems.map((item, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={item}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                  />
                  <button
                    className="ml-2 p-1 text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveItem(index)}
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
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                className="w-full p-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                onClick={handleAddItem}
              >
                + Добавить пункт
              </button>
            </div>
            <div className="flex justify-end mt-2 space-x-2">
              <button
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                onClick={handleCancelEdit}
              >
                Отмена
              </button>
              <button
                className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                onClick={handleSaveEdit}
              >
                Сохранить
              </button>
            </div>
          </div>
        );
      }
    }
    
    // Рендерим содержимое для разных типов элементов
    switch (element.type) {
      case 'text':
      case 'heading':
      case 'paragraph':
        return <div className="w-full h-full">{element.content}</div>;
        
      case 'list':
        return (
          <ul className={`w-full h-full ${element.listType === 'bullet' ? 'list-disc' : 'list-decimal'} pl-5`}>
            {element.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        );
        
      case 'image':
        return (
          <img
            src={element.src}
            alt={element.alt || 'Изображение'}
            className="w-full h-full object-contain"
          />
        );
        
      case 'divider':
        return <hr className="w-full my-2" />;
        
      case 'icon':
        // Простая реализация иконки (в реальном приложении использовать библиотеку иконок)
        return (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {element.iconName === 'star' ? (
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              ) : (
                <circle cx="12" cy="12" r="10" />
              )}
            </svg>
          </div>
        );
        
      case 'video':
        return (
          <iframe
            src={element.src}
            className="w-full h-full"
            allowFullScreen
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        );
        
      case 'chart':
        // Заглушка для графика (в реальном приложении использовать библиотеку графиков)
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
            <p className="text-gray-500">График: {element.chartType}</p>
          </div>
        );
        
      case 'button':
        return (
          <button
            className="w-full h-full flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              if (element.action?.type === 'link' && element.action.target) {
                window.open(element.action.target, '_blank');
              }
            }}
          >
            {element.text}
          </button>
        );
        
      default:
        return <div className="w-full h-full">Неизвестный тип элемента</div>;
    }
  };

  return (
    <div
      ref={elementRef}
      className={`
        'hover:outline hover:outline-1 hover:outline-blue-300'
        ${isDragging || isResizing ? 'z-10' : ''}
        ${isEditing ? 'z-20' : ''}
      `}
      style={getElementStyles()}
      onMouseDown={handleDragStart}
      onDoubleClick={handleDoubleClick}
      tabIndex={0}
      aria-label={`Элемент: ${element.type}`}
      onKeyDown={(e) => {
        if (e.key === 'Delete') {
          onDelete();
        }
      }}
    >
      {renderElementContent()}
      
      {/* Кнопки управления (видны только в режиме редактирования и при наведении) */}
      {!isEditing && (
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 flex space-x-1 bg-white rounded-md shadow-sm p-1 z-10">
          <button
            className="p-1 text-gray-500 hover:text-red-600 rounded"
            onClick={handleDelete}
            aria-label="Удалить элемент"
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
      {!isEditing && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-white border border-gray-300 rounded-tl cursor-se-resize"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
};

export default ElementComponent;