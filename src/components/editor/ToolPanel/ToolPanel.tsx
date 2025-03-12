import React, { useState } from 'react';
import { LayoutType, ElementType } from '@/types';
import styles from './ToolPanel.module.css';
interface ToolPanelProps {
  presentationId: string;
  slideId: string;
}

const ToolPanel: React.FC<ToolPanelProps> = ({ presentationId, slideId }) => {
  const [activeTab, setActiveTab] = useState<'layouts' | 'elements' | 'background'>('layouts');

  // Макеты, доступные для добавления
  const availableLayouts: { type: LayoutType; title: string; icon: React.ReactNode }[] = [
    {
      type: 'single-column',
      title: 'Одна колонка',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      ),
    },
    {
      type: 'two-columns',
      title: 'Две колонки',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="8" height="18" rx="1" />
          <rect x="13" y="3" width="8" height="18" rx="1" />
        </svg>
      ),
    },
    {
      type: 'three-columns',
      title: 'Три колонки',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="4" height="18" rx="1" />
          <rect x="10" y="3" width="4" height="18" rx="1" />
          <rect x="17" y="3" width="4" height="18" rx="1" />
        </svg>
      ),
    },
    {
      type: 'four-columns',
      title: 'Четыре колонки',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="4" height="18" rx="1" />
          <rect x="8" y="3" width="4" height="18" rx="1" />
          <rect x="14" y="3" width="4" height="18" rx="1" />
          <rect x="20" y="3" width="4" height="18" rx="1" />
        </svg>
      ),
    },
    {
      type: 'image-text',
      title: 'Изображение + текст',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="8" height="18" rx="1" />
          <rect x="13" y="3" width="8" height="6" rx="1" />
          <rect x="13" y="11" width="8" height="10" rx="1" />
        </svg>
      ),
    },
    {
      type: 'text-image',
      title: 'Текст + изображение',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="13" y="3" width="8" height="18" rx="1" />
          <rect x="3" y="3" width="8" height="6" rx="1" />
          <rect x="3" y="11" width="8" height="10" rx="1" />
        </svg>
      ),
    },
    {
      type: 'cards',
      title: 'Карточки',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      type: 'icons-with-text',
      title: 'Иконки с текстом',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="18" r="3" />
        </svg>
      ),
    },
    {
      type: 'blank',
      title: 'Пустой макет',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="12" y1="8" x2="12" y2="16" />
        </svg>
      ),
    },
  ];

  // Элементы, доступные для добавления
  const availableElements: { type: ElementType; title: string; icon: React.ReactNode }[] = [
    {
      type: 'text',
      title: 'Текст',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      ),
    },
    {
      type: 'heading',
      title: 'Заголовок',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12h16" />
          <path d="M4 6h16" />
          <path d="M4 18h12" />
        </svg>
      ),
    },
    {
      type: 'paragraph',
      title: 'Параграф',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6h4" />
          <path d="M2 12h9" />
          <path d="M2 18h4" />
          <path d="M12 12h6" />
          <path d="M12 18h6" />
        </svg>
      ),
    },
    {
      type: 'list',
      title: 'Список',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
    {
      type: 'image',
      title: 'Изображение',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
    },
    {
      type: 'divider',
      title: 'Разделитель',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>
      ),
    },
    {
      type: 'icon',
      title: 'Иконка',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      ),
    },
    {
      type: 'video',
      title: 'Видео',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="10" y1="8" x2="14" y2="12" />
          <line x1="14" y1="8" x2="10" y2="12" />
        </svg>
      ),
    },
    {
      type: 'chart',
      title: 'Диаграмма',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
      ),
    },
    {
      type: 'button',
      title: 'Кнопка',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
          <path d="M16 12h.01" />
          <path d="M13 12h.01" />
          <path d="M10 12h.01" />
        </svg>
      ),
    },
  ];

  // Обработчики драг-н-дроп
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, itemType: 'layout' | 'element', itemData: any) => {
    // Устанавливаем данные для перетаскивания в формате JSON
    const dragData = {
      type: itemType,
      ...itemData,
    };

    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className={styles.toolPanel}>
      <div className="h-full flex flex-col">
        {/* Табы панели инструментов */}
        <div className="flex border-b border-gray-200">
          <button
            className={`
            flex-1 py-3 px-4 text-sm font-medium
            ${activeTab === 'layouts' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}
          `}
            onClick={() => setActiveTab('layouts')}
            aria-label="Показать макеты"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('layouts');
              }
            }}
          >
            Макеты
          </button>

          <button
            className={`
            flex-1 py-3 px-4 text-sm font-medium
            ${activeTab === 'elements' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}
          `}
            onClick={() => setActiveTab('elements')}
            aria-label="Показать элементы"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('elements');
              }
            }}
          >
            Элементы
          </button>

          <button
            className={`
            flex-1 py-3 px-4 text-sm font-medium
            ${activeTab === 'background' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}
          `}
            onClick={() => setActiveTab('background')}
            aria-label="Настроить фон"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('background');
              }
            }}
          >
            Фон
          </button>
        </div>

        {/* Содержимое панели в зависимости от активного таба */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'layouts' && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Smart Layouts</h3>
              <div className="grid grid-cols-2 gap-4">
                {availableLayouts.map((layout) => (
                  <div
                    key={layout.type}
                    className="border border-gray-200 rounded-lg p-3 hover:border-blue-500 cursor-grab bg-white"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'layout', { layoutType: layout.type })}
                    aria-label={`Макет: ${layout.title}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        // Обработка нажатия клавиши (например, добавление макета)
                      }
                    }}
                  >
                    <div className="mb-2 text-gray-600 flex justify-center">
                      {layout.icon}
                    </div>
                    <p className="text-xs text-center text-gray-800">{layout.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'elements' && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Элементы</h3>
              <div className="grid grid-cols-2 gap-4">
                {availableElements.map((element) => (
                  <div
                    key={element.type}
                    className="border border-gray-200 rounded-lg p-3 hover:border-blue-500 cursor-grab bg-white"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'element', { elementType: element.type })}
                    aria-label={`Элемент: ${element.title}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        // Обработка нажатия клавиши (например, добавление элемента)
                      }
                    }}
                  >
                    <div className="mb-2 text-gray-600 flex justify-center">
                      {element.icon}
                    </div>
                    <p className="text-xs text-center text-gray-800">{element.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'background' && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Фон слайда</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цвет фона
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {['#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#6c757d', '#495057', '#343a40', '#212529', '#000000'].map((color) => (
                      <button
                        key={color}
                        className="w-full aspect-square rounded-md border border-gray-300 cursor-pointer"
                        style={{ backgroundColor: color }}
                        aria-label={`Выбрать цвет фона: ${color}`}
                        tabIndex={0}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пользовательский цвет
                  </label>
                  <input
                    type="color"
                    className="w-full h-10 rounded-md border border-gray-300 cursor-pointer"
                    defaultValue="#ffffff"
                    aria-label="Выбрать пользовательский цвет фона"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Изображение фона
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Загрузить файл</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                        </label>
                        <p className="pl-1">или перетащите изображение</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF до 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolPanel; 