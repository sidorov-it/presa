import React, { useRef } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { Element as SlideElement } from '@/types';
import { GridElementType, GridTextElement, GridEditorElement, GridListElement, GridImageElement } from '@/types/grid-elements';
import Tiptap from '@/components/tiptap/Tiptap';
import styles from './GridCellElement.module.css';
import { v4 as uuidv4 } from 'uuid';

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
        
        // Создаем новую ячейку в структуре сетки
        const updatedGridStructure = { ...layout.gridStructure };
        
        // Если нет строк, создаем первую строку
        if (updatedGridStructure.rows.length === 0) {
            updatedGridStructure.rows.push({
                id: uuidv4(),
                cells: []
            });
        }
        
        // Добавляем новую строку
        const newRowId = uuidv4();
        updatedGridStructure.rows.push({
            id: newRowId,
            cells: [{
                id: uuidv4(),
                row: updatedGridStructure.rows.length + 1,
                column: 1,
                rowSpan: 1,
                colSpan: updatedGridStructure.columns,
                elementIds: [],
                gridArea: `area-${uuidv4()}`
            }]
        });
        
        // Обновляем макет с новой структурой сетки
        updateLayout(presentationId, slideId, layoutId, {
            gridStructure: updatedGridStructure
        });
        
        // Создаем новый элемент редактора
        const newEditor: Omit<GridEditorElement, 'id'> = {
            type: 'editor',
            content: '',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 40 },
            style: { fontSize: '16px', color: '#333333' },
            zIndex: 1,
            gridArea: updatedGridStructure.rows[updatedGridStructure.rows.length - 1].cells[0].gridArea || `area-${uuidv4()}`,
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
        
        // Если элемент был в последней строке и это был единственный элемент в этой строке,
        // удаляем строку из структуры сетки
        if (layout.gridStructure.rows.length > 1) {
            const elementCell = layout.gridStructure.rows
                .flatMap(row => row.cells)
                .find(cell => cell.elementIds.includes(element.id));
                
            if (elementCell) {
                const rowWithElement = layout.gridStructure.rows.find(row => 
                    row.cells.some(cell => cell.id === elementCell.id)
                );
                
                if (rowWithElement && rowWithElement.cells.length === 1 && 
                    rowWithElement.cells[0].elementIds.length === 1) {
                    // Это последний элемент в строке, удаляем строку
                    const updatedRows = layout.gridStructure.rows.filter(row => row.id !== rowWithElement.id);
                    
                    if (updatedRows.length > 0) {
                        updateLayout(presentationId, slideId, layoutId, {
                            gridStructure: {
                                ...layout.gridStructure,
                                rows: updatedRows
                            }
                        });
                    }
                }
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