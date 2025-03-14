import React, { useRef } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { Element as SlideElement } from '@/types';
import { GridElementType, GridTextElement, GridEditorElement, GridListElement, GridImageElement } from '@/types/grid-elements';
import Tiptap from '@/components/tiptap/Tiptap';
import styles from './GridCellElement.module.css';
import { v4 as uuidv4 } from 'uuid';
import { LayoutType } from '@/types';

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
        
        // Instead of adding a new row to the grid structure, we'll add a new block layout
        // Create a new layout with a grid that has 1 row and the same number of columns as the current layout
        const newLayoutId = uuidv4();
        const newLayout = {
            id: newLayoutId,
            type: 'custom' as LayoutType,
            elements: [],
            style: {},
            gridStructure: {
                columns: layout.gridStructure.columns,
                rows: [
                    {
                        id: uuidv4(),
                        cells: Array.from({ length: layout.gridStructure.columns }, (_, index) => ({
                            id: uuidv4(),
                            row: 1,
                            column: index + 1,
                            rowSpan: 1,
                            colSpan: 1,
                            elementIds: [],
                            gridArea: `area-${uuidv4()}`
                        }))
                    }
                ]
            }
        };
        
        // Add the new layout to the slide
        const updatedLayouts = [...slide.layouts];
        const currentLayoutIndex = updatedLayouts.findIndex(l => l.id === layoutId);
        updatedLayouts.splice(currentLayoutIndex + 1, 0, newLayout);
        
        // Update the slide with the new layouts
        usePresentationStore.getState().updateSlide(presentationId, slideId, {
            layouts: updatedLayouts
        });
        
        // Create a new editor element for the first cell of the new layout
        const newEditor: Omit<GridEditorElement, 'id'> = {
            type: 'editor',
            content: '',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 40 },
            style: { fontSize: '16px', color: '#333333' },
            zIndex: 1,
            gridArea: newLayout.gridStructure.rows[0].cells[0].gridArea,
            placeholder: ''
        };
        
        // Add the new editor element to the new layout
        usePresentationStore.getState().addElement(presentationId, slideId, newLayoutId, newEditor as any);
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
        
        // If this is the only element in the layout and there are other layouts, delete the entire layout
        if (layout.elements.length === 1) {
            // Only delete the layout if there's at least one other layout
            if (slide.layouts.length > 1) {
                usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
            }
        }
    };
    
    // Получаем содержимое для редактора в зависимости от типа элемента
    const getEditorContent = (): string => {
        switch (element.type) {
            case 'editor':
            case 'text':
            case 'heading':
            case 'paragraph':
                return (element as unknown as GridTextElement).content;
            case 'list':
                const listElement = element as unknown as GridListElement;
                const listType = listElement.listType === 'bullet' ? 'ul' : 'ol';
                const items = listElement.items.map(item => `<li>${item}</li>`).join('');
                return `<${listType}>${items}</${listType}>`;
            case 'image':
                const imageElement = element as unknown as GridImageElement;
                return `<img src="${imageElement.src}" alt="${imageElement.alt}" style="max-width: 100%; height: auto;" />`;
            default:
                return `<p>Неподдерживаемый тип элемента: ${element.type}</p>`;
        }
    };
    
    // Получаем плейсхолдер для редактора
    const getPlaceholder = (): string => {
        return 'Введите / для выбора блока';
    };
    
    // Создаем объект стилей
    const cellStyle: React.CSSProperties = {
        ...element.style
    };
    
    if (element.cellId) {
        cellStyle.gridArea = element.cellId;
    } else {
        cellStyle.gridArea = 'auto';
    }

    console.log('cellStyle.gridArea', cellStyle.gridArea)
    const placeholder = isSelected ? getPlaceholder() : ''; 
    return (
        <div 
            className={`${styles.gridCell} ${isSelected ? styles.gridCellSelected : ''}`}
            onClick={onSelect}
            style={cellStyle}
        >
            {/* <span>{cellStyle.gridArea}</span> */}
            <Tiptap
                id={element.cellId}
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