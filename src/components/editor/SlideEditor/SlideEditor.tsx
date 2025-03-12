import React, { useState, useEffect, useRef } from 'react';
import { Slide, Layout, LayoutType, Element, TextElement, ListElement } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import LayoutComponent from '@/components/layouts/LayoutComponent';
import styles from './SlideEditor.module.css';
import Tiptap from '@/components/tiptap/Tiptap';
import { v4 as uuidv4 } from 'uuid';

// Определяем интерфейс для редактора
interface EditorInstance {
    id: string;
    content: string;
}

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
    isSelected,
    handleSelectSlide,
}) => {
    const { updateSlide, addLayout, deleteLayout, updateLayout, addSlide, addElement } = usePresentationStore();
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [showSlashCommands, setShowSlashCommands] = useState(false);
    const [slashCommandsPosition, setSlashCommandsPosition] = useState({ x: 0, y: 0 });
    const [showTemplates, setShowTemplates] = useState(slide.layouts.length === 0);
    
    // Состояние для хранения редакторов
    const [editors, setEditors] = useState<EditorInstance[]>(() => {
        // Если слайд пустой, создаем один пустой редактор
        if (slide.layouts.length === 0) {
            return [{ id: uuidv4(), content: '' }];
        }
        return [];
    });
    
    // Состояние для отслеживания активного редактора
    const [activeEditorId, setActiveEditorId] = useState<string | null>(
        editors.length > 0 ? editors[0].id : null
    );
    
    const editorRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

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
            // Если у нас нет редакторов, создаем один
            if (editors.length === 0) {
                const newEditor = { id: uuidv4(), content: '' };
                setEditors([newEditor]);
                setActiveEditorId(newEditor.id);
            } else if (activeEditorId === null && editors.length > 0) {
                // Если есть редакторы, но активный не выбран, выбираем первый
                setActiveEditorId(editors[0].id);
            }
        } else {
            setSelectedLayoutId(null);
        }
    };

    // Обработчик для добавления нового редактора при нажатии Enter
    const handleEnterPressed = (editorId: string) => {
        // Находим индекс текущего редактора
        const currentIndex = editors.findIndex(editor => editor.id === editorId);
        if (currentIndex === -1) return;
        
        // Создаем новый редактор
        const newEditor = { id: uuidv4(), content: '' };
        
        // Вставляем новый редактор после текущего
        const newEditors = [
            ...editors.slice(0, currentIndex + 1),
            newEditor,
            ...editors.slice(currentIndex + 1)
        ];
        
        setEditors(newEditors);
        
        // Устанавливаем фокус на новый редактор
        setActiveEditorId(newEditor.id);
    };

    // Обработчик для удаления пустого редактора при нажатии Backspace
    const handleBackspacePressed = (editorId: string) => {
        // Если у нас только один редактор, не удаляем его
        if (editors.length <= 1) return;
        
        // Находим индекс текущего редактора
        const currentIndex = editors.findIndex(editor => editor.id === editorId);
        if (currentIndex === -1) return;
        
        // Удаляем текущий редактор
        const newEditors = [
            ...editors.slice(0, currentIndex),
            ...editors.slice(currentIndex + 1)
        ];
        
        setEditors(newEditors);
        
        // Устанавливаем фокус на предыдущий редактор (или следующий, если предыдущего нет)
        const newActiveIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        if (newEditors.length > 0) {
            setActiveEditorId(newEditors[newActiveIndex].id);
        }
    };

    // Обработчик для фокуса на редакторе
    const handleEditorFocus = (editorId: string) => {
        setActiveEditorId(editorId);
    };

    // Обработчик для изменения содержимого редактора
    const handleContentChange = (editorId: string, content: string) => {
        // Обновляем содержимое редактора
        const newEditors = editors.map(editor => 
            editor.id === editorId ? { ...editor, content } : editor
        );
        
        setEditors(newEditors);
    };

    // Показать меню слеш-команд
    const showSlashCommandMenu = (element: HTMLTextAreaElement) => {
        const { selectionStart } = element;
        const textBeforeCursor = element.value.substring(0, selectionStart);
        const lines = textBeforeCursor.split('\n');
        const currentLineIndex = lines.length - 1;
        
        // Получаем размеры и позицию textarea
        const rect = element.getBoundingClientRect();
        
        // Определяем позицию каретки
        const lineHeight = 24; // примерная высота строки
        const topOffset = rect.top + (currentLineIndex * lineHeight) + lineHeight;
        
        setSlashCommandsPosition({
            x: rect.left + 20,
            y: topOffset
        });
        
        setShowSlashCommands(true);
    };

    // Обработчик выбора слеш-команды
    const handleSlashCommandSelect = (command: string) => {
        setShowSlashCommands(false);
        
        // Создаем новый макет на основе команды
        const newLayout: Omit<Layout, 'id'> = {
            type: 'single-column',
            elements: [],
            style: {},
        };
        
        // Добавляем макет на слайд
        const layoutId = addLayout(presentationId, slide.id, newLayout);
        
        // Определяем тип элемента на основе команды
        if (command.startsWith('heading')) {
            const headingElement: Omit<TextElement, 'id'> = {
                type: 'heading',
                content: 'Заголовок',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 60 },
                style: { fontSize: '28px', fontWeight: 'bold', color: '#111111', textAlign: 'center' },
                zIndex: 1,
            };
            addElement(presentationId, slide.id, layoutId, headingElement);
        } else if (command === 'paragraph') {
            const paragraphElement: Omit<TextElement, 'id'> = {
                type: 'paragraph',
                content: editContent.replace('/', ''),
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: { fontSize: '16px', color: '#333333', textAlign: 'left' },
                zIndex: 1,
            };
            addElement(presentationId, slide.id, layoutId, paragraphElement);
        } else if (command.startsWith('list')) {
            const listType = command === 'list-bullet' ? 'bullet' : 'numbered';
            const listElement: Omit<ListElement, 'id'> = {
                type: 'list',
                items: ['Первый пункт', 'Второй пункт', 'Третий пункт'],
                listType: 'bullet',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 120 },
                style: { fontSize: '16px', color: '#333333' },
                zIndex: 1,
            };
            addElement(presentationId, slide.id, layoutId, listElement);
        }
        
        setIsEditing(false);
        setShowTemplates(false);
    };

    // Обработчик отмены редактирования
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditContent('');
    };

    // Обработчик сохранения текста
    const handleSaveEdit = () => {
        if (editContent.trim()) {
            // Создаем новый макет
            const newLayout: Omit<Layout, 'id'> = {
                type: 'single-column',
                elements: [],
                style: {},
            };
            
            // Добавляем макет на слайд
            const layoutId = addLayout(presentationId, slide.id, newLayout);
            
            // Добавляем текстовый элемент
            const textElement: Omit<TextElement, 'id'> = {
                type: 'paragraph',
                content: editContent,
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: { fontSize: '16px', color: '#333333', textAlign: 'left' },
                zIndex: 1,
            };
            addElement(presentationId, slide.id, layoutId, textElement);
        }
        
        setIsEditing(false);
        setEditContent('');
        setShowTemplates(false);
    };

    // Обработчик для выбора шаблона
    const handleSelectTemplate = (template: TemplateCard) => {
        // Создаем новый макет
        const newLayout: Omit<Layout, 'id'> = {
            type: template.type,
            elements: [],
            style: {},
        };
        
        // Добавляем макет на слайд
        addLayout(presentationId, slide.id, newLayout);
        
        setIsEditing(false);
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

                // Создаем новый макет
                const newLayout: Omit<Layout, 'id'> = {
                    type: layoutType,
                    elements: [],
                    style: {},
                };

                // Добавляем макет на слайд
                const newLayoutId = addLayout(presentationId, slide.id, newLayout);
                setSelectedLayoutId(newLayoutId);
                setShowTemplates(false);
            }
        } catch (error) {
            console.error('Error parsing drag data:', error);
        }
    };

    // Обработчик для выбора макета
    const handleSelectLayout = (layoutId: string) => {
        setSelectedLayoutId(layoutId);
    };

    // Обработчик для удаления макета
    const handleDeleteLayout = (layoutId: string) => {
        deleteLayout(presentationId, slide.id, layoutId);
        if (selectedLayoutId === layoutId) {
            setSelectedLayoutId(null);
        }
        
        // Если удалили последний макет, показываем шаблоны
        if (slide.layouts.length <= 1) {
            setShowTemplates(true);
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
                    {/* Контейнер для содержимого с CSS Grid */}
                    <div className={`relative w-full h-full p-8 mt-10 ${styles.slideContent}`}>
                        {/* Если у нас есть редакторы, отображаем их */}
                        {editors.length > 0 && slide.layouts.length === 0 && (
                            editors.map((editor, index) => (
                                <div key={editor.id} className={styles.editorRow}>
                                    <Tiptap 
                                        id={editor.id}
                                        initialContent={editor.content}
                                        onEnterPressed={() => handleEnterPressed(editor.id)}
                                        onBackspacePressed={() => handleBackspacePressed(editor.id)}
                                        onFocus={() => handleEditorFocus(editor.id)}
                                        onContentChange={(content) => handleContentChange(editor.id, content)}
                                        autoFocus={editor.id === activeEditorId}
                                        placeholder={index === 0 ? "Введите заголовок..." : "Введите текст..."}
                                    />
                                </div>
                            ))
                        )}

                        {/* Рендерим макеты */}
                        {slide.layouts.map((layout) => (
                            <div
                                key={layout.id}
                                className="relative mb-4 h-auto"
                                style={{ minHeight: '200px' }}
                            >
                                <LayoutComponent
                                    layout={layout}
                                    presentationId={presentationId}
                                    slideId={slide.id}
                                    isSelected={selectedLayoutId === layout.id}
                                    onSelect={() => handleSelectLayout(layout.id)}
                                    onDelete={() => handleDeleteLayout(layout.id)}
                                />
                            </div>
                        ))}

                        {/* Шаблоны для пустого слайда */}
                        {showTemplates && editors.length === 0 && !isEditing && (
                            <div className="max-w-3xl mx-auto text-center mt-8 py-6">
                                <h3 className="text-lg font-medium text-gray-600 mb-5">
                                    {slide.layouts.length === 0 
                                        ? "Выберите шаблон или нажмите для создания слайда" 
                                        : "Выберите шаблон для продолжения"}
                                </h3>
                                <div className="grid grid-cols-4 gap-4 mt-2">
                                    {templates.map((template) => (
                                        <div
                                            key={template.id}
                                            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-all shadow-sm hover:shadow"
                                            onClick={() => handleSelectTemplate(template)}
                                        >
                                            <div className="mb-3 text-gray-500 flex justify-center">
                                                {template.icon}
                                            </div>
                                            <p className="text-sm text-gray-700 font-medium">{template.title}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Подсказка для клика по пустому слайду */}
                        {slide.layouts.length === 0 && editors.length === 0 && !showTemplates && !isEditing && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                                <p className="text-lg">Нажмите для создания слайда</p>
                            </div>
                        )}
                    </div>
                </div>
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
    );
};

export default SlideEditor; 