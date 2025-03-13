import React, { useRef } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { Element as SlideElement } from '@/types';
import { GridElementType, GridTextElement, GridEditorElement, GridListElement, GridImageElement } from '@/types/grid-elements';
import Tiptap from '@/components/tiptap/Tiptap';
import styles from './GridCellElement.module.css';

// Компонент для отображения элемента в ячейке сетки
const GridCellElement: React.FC<{
    element: SlideElement;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}> = ({ element, presentationId, slideId, layoutId, isSelected, onSelect, onDelete }) => {
    const { updateElement, updateLayout } = usePresentationStore();
    const dragHandleRef = useRef<HTMLDivElement>(null);
    
    // Обработчик для изменения содержимого редактора
    const handleEditorContentChange = (content: string) => {
        updateElement(presentationId, slideId, layoutId, element.id, {
            content: content
        } as Partial<SlideElement>);
    };
    
    // Обработчик для добавления нового редактора при нажатии Enter
    const handleEnterPressed = () => {
        // Получаем текущий макет
        const presentation = usePresentationStore.getState().getPresentation(presentationId);
        if (!presentation) return;
        
        const slide = presentation.slides.find(s => s.id === slideId);
        if (!slide) return;
        
        const layout = slide.layouts.find(l => l.id === layoutId);
        if (!layout) return;
        
        // Получаем текущую структуру сетки
        let { gridTemplateAreas, gridTemplateColumns, gridTemplateRows } = layout;
        
        // Создаем новую строку в сетке
        const rowsArray = gridTemplateRows.split(' ');
        rowsArray.push('auto');
        const newGridTemplateRows = rowsArray.join(' ');
        
        // Создаем новую область в сетке
        const areasArray = gridTemplateAreas.split('"').filter(s => s.trim());
        const newAreaName = `content-${layout.elements.length + 1}`;
        areasArray.push(`${newAreaName}`);
        const newGridTemplateAreas = `${areasArray.join(' ')}`;
        
        // Обновляем макет с новой структурой сетки
        updateLayout(presentationId, slideId, layoutId, {
            gridTemplateRows: newGridTemplateRows,
            gridTemplateAreas: newGridTemplateAreas
        });
        
        // Создаем новый элемент редактора
        const newEditor: Omit<GridEditorElement, 'id'> = {
            type: 'editor',
            content: '',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 40 },
            style: { fontSize: '16px', color: '#333333' },
            zIndex: 1,
            gridArea: newAreaName,
            placeholder: ''
        };
        
        // Добавляем новый элемент в макет
        usePresentationStore.getState().addElement(presentationId, slideId, layoutId, newEditor as any);
    };
    
    // Обработчик для удаления пустого редактора при нажатии Backspace
    const handleBackspacePressed = () => {
        // Если это единственный элемент в макете, не удаляем его
        const presentation = usePresentationStore.getState().getPresentation(presentationId);
        if (!presentation) return;
        
        const slide = presentation.slides.find(s => s.id === slideId);
        if (!slide) return;
        
        const layout = slide.layouts.find(l => l.id === layoutId);
        if (!layout || layout.elements.length <= 1) return;
        
        // Удаляем элемент
        usePresentationStore.getState().deleteElement(presentationId, slideId, layoutId, element.id);
    };
    
    // Получаем содержимое для редактора в зависимости от типа элемента
    const getEditorContent = (): string => {
        switch (element.type) {
            case 'editor':
            case 'text':
            case 'heading':
            case 'paragraph':
                return (element as GridTextElement).content;
            case 'list':
                const listElement = element as GridListElement;
                const listType = listElement.listType === 'bullet' ? 'ul' : 'ol';
                const items = listElement.items.map(item => `<li>${item}</li>`).join('');
                return `<${listType}>${items}</${listType}>`;
            case 'image':
                const imageElement = element as GridImageElement;
                return `<img src="${imageElement.src}" alt="${imageElement.alt}" style="max-width: 100%; height: auto;" />`;
            default:
                return `<p>Неподдерживаемый тип элемента: ${element.type}</p>`;
        }
    };
    
    // Получаем плейсхолдер для редактора
    const getPlaceholder = (): string => {
        return  'Введите / для выбора блока'
        if (element.type === 'editor') {
            const editorElement = element as any;
            return editorElement.placeholder ?? 'Введите / для выбора блока';
        }
        
        switch (element.type) {
            // case 'heading':
            //     return 'Введите заголовок...';
            // case 'paragraph':
            // case 'text':
            //     return 'Введите текст...';
            // case 'list':
            //     return 'Введите элемент списка...';
            default:
                return '';
        }
    };
    
    // Создаем объект стилей
    const cellStyle: React.CSSProperties = {
        ...element.style
    };
    
    // Добавляем gridArea, если она определена
    if (element.gridArea) {
        cellStyle.gridArea = element.gridArea;
    } else {
        cellStyle.gridArea = 'auto';
    }

    const placeholder = isSelected ? getPlaceholder() : ''; 
    return (
        <div 
            className={`${styles.gridCell} ${isSelected ? styles.gridCellSelected : ''}`}
            onClick={onSelect}
            style={cellStyle}
        >
            <Tiptap
                id={element.id}
                initialContent={getEditorContent()}
                onEnterPressed={handleEnterPressed}
                onBackspacePressed={handleBackspacePressed}
                onFocus={onSelect}
                onContentChange={handleEditorContentChange}
                autoFocus={isSelected}
                placeholder={placeholder}
                customBubbleMenuTrigger={dragHandleRef}
            />

            <div 
                ref={dragHandleRef}
                className={styles.dragHandle}
            />
        </div>
    );
};

export default GridCellElement;