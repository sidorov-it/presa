import React, { useState, useEffect, useRef } from 'react';
import { Slide, Layout, LayoutType, Element, TextElement, ListElement, EditorElement, GridTemplates, ImageElement, generateUniqueGridArea } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { GridEditorElement, GridImageElement } from '@/types/grid-elements';
import { usePresentationStore } from '@/store/presentationStore';
import styles from './SlideEditor.module.css';
import GridCellElement from '../GridCellElement';


interface SlideEditorProps {
    slide: Slide;
    presentationId: string;
    handleSelectSlide: (slideId: string) => void;
    isSelected: boolean;
}

interface TemplateCard {
    id: string;
    title: string;
    icon: React.ReactNode;
    type: LayoutType;
}

// Компонент для слеш-команд
interface SlashCommandsProps {
    isOpen: boolean;
    position: { x: number; y: number };
    onSelect: (command: string) => void;
    onClose: () => void;
}

const SlashCommands: React.FC<SlashCommandsProps> = ({ isOpen, position, onSelect, onClose }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const commands = [
        { id: 'heading', label: 'Заголовок', icon: 'H1' },
        { id: 'paragraph', label: 'Текст', icon: 'T' },
        { id: 'list-bullet', label: 'Маркированный список', icon: '•' },
        { id: 'list-number', label: 'Нумерованный список', icon: '1.' },
        { id: 'image', label: 'Изображение', icon: '🖼️' },
        { id: 'divider', label: 'Разделитель', icon: '—' },
        { id: 'code', label: 'Код', icon: '</>' },
        { id: 'quote', label: 'Цитата', icon: '"' },
    ];

    useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        setActiveIndex(prev => (prev + 1) % commands.length);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        setActiveIndex(prev => (prev - 1 + commands.length) % commands.length);
                        break;
                    case 'Enter':
                        e.preventDefault();
                        onSelect(commands[activeIndex].id);
                        break;
                    case 'Escape':
                        e.preventDefault();
                        onClose();
                        break;
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, activeIndex, commands, onSelect, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="absolute z-50 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200"
            style={{
                top: `${position.y}px`,
                left: `${position.x}px`,
                width: '240px'
            }}
        >
            <div className="p-2 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-medium text-gray-500">Выберите блок</p>
            </div>
            <div className="py-1 max-h-64 overflow-y-auto">
                {commands.map((command, index) => (
                    <div
                        key={command.id}
                        className={`flex items-center px-3 py-2 cursor-pointer hover:bg-blue-50 ${activeIndex === index ? 'bg-blue-50' : ''}`}
                        onClick={() => onSelect(command.id)}
                        onMouseEnter={() => setActiveIndex(index)}
                    >
                        <div className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 mr-3 text-gray-600 font-medium">
                            {command.icon}
                        </div>
                        <span className="text-gray-700">{command.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const SlideEditor: React.FC<SlideEditorProps> = ({
    slide,
    presentationId,
    handleSelectSlide,
    isSelected,
}) => {
    const { updateSlide, addLayout, deleteLayout, updateLayout, addSlide, addElement } = usePresentationStore();
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [showTemplates, setShowTemplates] = useState(slide.layouts.length === 0);

    const editorRef = useRef<HTMLDivElement>(null);
    // Популярные шаблоны для слайдов
    const templates: TemplateCard[] = [
        {
            id: 'title-text',
            title: 'Заголовок и текст',
            type: 'single-column',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h16" />
                    <path d="M4 11h16" />
                    <path d="M4 15h10" />
                </svg>
            )
        },
        {
            id: 'two-columns',
            title: 'Две колонки',
            type: 'two-columns',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="8" height="18" rx="1" />
                    <rect x="13" y="3" width="8" height="18" rx="1" />
                </svg>
            )
        },
        {
            id: 'image-text',
            title: 'Изображение и текст',
            type: 'image-text',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="8" height="18" rx="1" />
                    <rect x="13" y="3" width="8" height="6" rx="1" />
                    <rect x="13" y="11" width="8" height="10" rx="1" />
                </svg>
            )
        },
        {
            id: 'card-grid',
            title: 'Сетка карточек',
            type: 'cards',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            )
        },
    ];

    // Обработчик для клика по слайду (начать редактирование если слайд пустой)
    const handleSlideClick = (e: React.MouseEvent) => {
        if (slide.layouts.length === 0) {
            // Создаем новый макет с одной ячейкой
            createDefaultLayout();
        } else {
            setSelectedElementId(null);
        }
    };

    // Создание макета по умолчанию с одним редактором
    const createDefaultLayout = () => {
        // Создаем новый макет с одной ячейкой
        const gridTemplate = GridTemplates['single-column'];

        const newLayout: Omit<Layout, 'id'> = {
            type: 'single-column',
            elements: [],
            style: {},
            gridTemplateAreas: gridTemplate.areas,
            gridTemplateColumns: gridTemplate.columns,
            gridTemplateRows: gridTemplate.rows
        };

        // Добавляем макет на слайд
        const layoutId = addLayout(presentationId, slide.id, newLayout);

        // Добавляем редактор в ячейку
        const editorElement: Omit<GridEditorElement, 'id'> = {
            type: 'editor',
            content: '',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 40 },
            style: { fontSize: '16px', color: '#333333' },
            zIndex: 1,
            gridArea: 'content', // Используем область 'content' из шаблона single-column
            placeholder: 'Введите текст...'
        };

        const elementId = addElement(presentationId, slide.id, layoutId, editorElement as any);
        setSelectedElementId(elementId);
        setShowTemplates(false);
    };

    // Рекурсивная функция для рендеринга макетов и их вложенных элементов
    const renderLayoutContent = (layout: Layout) => {
        return (
            <div
                key={layout.id}
                className={styles.gridContainer}
                style={{
                    display: 'grid',
                    gridTemplateAreas: layout.gridTemplateAreas,
                    gridTemplateColumns: layout.gridTemplateColumns,
                    gridTemplateRows: layout.gridTemplateRows,
                    gap: '1rem',
                    gridArea: layout.gridArea,
                    ...layout.style
                }}
            >
                {layout.elements.map((element) => {
                    if ('type' in element && 'elements' in element) {
                        // Это вложенный макет
                        return renderLayoutContent(element as Layout);
                    } else {
                        // Это обычный элемент
                        return (
                            <GridCellElement
                                key={element.id}
                                element={element as Element}
                                presentationId={presentationId}
                                slideId={slide.id}
                                layoutId={layout.id}
                                isSelected={selectedElementId === element.id}
                                onSelect={() => handleSelectElement(element.id)}
                                onDelete={() => handleDeleteElement(layout.id, element.id)}
                            />
                        );
                    }
                })}
            </div>
        );
    };

    // Обновляем функцию создания макета для поддержки уникальных областей сетки
    const handleSelectTemplate = (template: TemplateCard) => {
        const gridTemplate = GridTemplates[template.type];

        // Создаем новый макет с уникальными именами областей
        const layoutId = uuidv4();
        const areas = gridTemplate.areas.split('"').filter(s => s.trim());
        const uniqueAreas = areas.map(area => {
            const areaNames = area.trim().split(' ');
            return areaNames.map(name => generateUniqueGridArea(name, layoutId)).join(' ');
        });

        const newLayout: Omit<Layout, 'id'> = {
            type: template.type,
            elements: [],
            style: {},
            gridTemplateAreas: `"${uniqueAreas.join('" "')}"`,
            gridTemplateColumns: gridTemplate.columns,
            gridTemplateRows: gridTemplate.rows
        };

        // Добавляем макет на слайд
        addLayout(presentationId, slide.id, newLayout);

        // Добавляем элементы в зависимости от типа макета
        if (template.type === 'single-column') {
            // Добавляем заголовок и текст
            const headingElement: Omit<GridEditorElement, 'id'> = {
                type: 'editor',
                content: '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 60 },
                style: { fontSize: '28px', fontWeight: 'bold', color: '#111111' },
                zIndex: 1,
                gridArea: 'content',
                placeholder: 'Введите заголовок...'
            };

            const elementId = addElement(presentationId, slide.id, layoutId, headingElement as any);
            setSelectedElementId(elementId);
        } else if (template.type === 'two-columns') {
            // Добавляем два редактора
            const leftEditor: Omit<GridEditorElement, 'id'> = {
                type: 'editor',
                content: '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: { fontSize: '16px', color: '#333333' },
                zIndex: 1,
                gridArea: 'left',
                placeholder: 'Левая колонка...'
            };

            const rightEditor: Omit<GridEditorElement, 'id'> = {
                type: 'editor',
                content: '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: { fontSize: '16px', color: '#333333' },
                zIndex: 1,
                gridArea: 'right',
                placeholder: 'Правая колонка...'
            };

            const leftId = addElement(presentationId, slide.id, layoutId, leftEditor as any);
            addElement(presentationId, slide.id, layoutId, rightEditor as any);
            setSelectedElementId(leftId);
        } else if (template.type === 'image-text') {
            // Добавляем изображение и текст
            const imageElement: Omit<GridImageElement, 'id'> = {
                type: 'image',
                src: 'https://via.placeholder.com/400x300',
                alt: 'Placeholder Image',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: {},
                zIndex: 1,
                gridArea: 'image'
            };

            const textEditor: Omit<GridEditorElement, 'id'> = {
                type: 'editor',
                content: '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: { fontSize: '16px', color: '#333333' },
                zIndex: 1,
                gridArea: 'content',
                placeholder: 'Введите текст...'
            };

            addElement(presentationId, slide.id, layoutId, imageElement as any);
            const textId = addElement(presentationId, slide.id, layoutId, textEditor as any);
            setSelectedElementId(textId);
        }

        setShowTemplates(false);
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

            if (data.type === 'layout') {
                const layoutType = data.layoutType as LayoutType;
                handleSelectTemplate(templates.find(t => t.type === layoutType) || templates[0]);
            }
        } catch (error) {
            console.error('Error parsing drag data:', error);
        }
    };

    // Обработчик для выбора элемента
    const handleSelectElement = (elementId: string) => {
        setSelectedElementId(elementId);
    };

    // Обработчик для удаления элемента
    const handleDeleteElement = (layoutId: string, elementId: string) => {
        usePresentationStore.getState().deleteElement(presentationId, slide.id, layoutId, elementId);
        if (selectedElementId === elementId) {
            setSelectedElementId(null);
        }
    };

    // Обработчик для добавления нового слайда после текущего
    const handleAddSlideAfter = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        // Получаем презентацию из хранилища
        const presentation = usePresentationStore.getState().getPresentation(presentationId);

        if (!presentation) return;

        // Находим индекс текущего слайда
        const currentSlideIndex = presentation.slides.findIndex(s => s.id === slide.id);

        if (currentSlideIndex === -1) return;

        // Добавляем новый слайд
        const newSlideId = addSlide(presentationId);

        // Перемещаем новый слайд на позицию после текущего
        const newSlideIndex = presentation.slides.length - 1; // Индекс нового слайда (последний)
        usePresentationStore.getState().reorderSlides(
            presentationId,
            newSlideIndex,
            currentSlideIndex + 1
        );

        // Выбираем новый слайд
        handleSelectSlide(newSlideId);
    };

    // Получаем стиль фона слайда
    const getBackgroundStyle = () => {
        if (slide.background?.type === 'color') {
            return { backgroundColor: slide.background.value };
        } else if (slide.background?.type === 'image') {
            return {
                backgroundImage: `url(${slide.background.value})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            };
        }
        return {};
    };

    // Определяем классы для слайда
    const getSlideClassName = () => {
        let className = styles.slideWrapper;

        if (isSelected) {
            className += ` ${styles.slideSelected}`;
        } else if (isHovered) {
            className += ` ${styles.slideHovered}`;
        }

        return className;
    };

    // Обработчики наведения мыши
    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <div
            className={styles.slide}
            onMouseEnter={() => {
                handleMouseEnter();
                handleSelectSlide(slide.id);
            }}
            onMouseLeave={handleMouseLeave}
        >
            {/* Обертка для слайда с применением стилей границы */}
            <div className={getSlideClassName()}>
                <div
                    ref={editorRef}
                    className={`relative min-h-20 overflow-auto w-full rounded-3xl cursor-text`}
                    style={{
                        ...slide.style,
                        ...getBackgroundStyle(),
                    }}
                    onClick={handleSlideClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {/* Контейнер для содержимого */}
                    <div className="relative w-full h-full p-8 mt-10">
                        {slide.layouts.map((layout) => renderLayoutContent(layout))}
                    </div>

                    <div className={styles.slideDivider + ' ' + (isHovered ? styles.slideDividerHovered : '')}>
                        <div className={styles.buttons}>
                            <button
                                className={styles.slideDividerButton}
                                onClick={handleAddSlideAfter}
                                aria-label="Добавить слайд"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SlideEditor; 