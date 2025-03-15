import React, { useRef, useState, useEffect } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { useEditorStore } from '@/store/editorStore';
import { getPredefinedGridStructures, GridStructure, Layout, Element as SlideElement } from '@/types';
import { GridListElement, GridImageElement, GridTextElement } from '@/types/grid-elements';
import Tiptap, { TiptapRef } from '@/components/tiptap/Tiptap';
import styles from './GridCellElement.module.css';
import { generateId } from '@/utils/id';

// Create a global registry to store editor refs
// This allows us to access any editor by its ID
const editorRefs: Record<string, React.RefObject<TiptapRef>> = {};

// Компонент для отображения элемента в ячейке сетки
const GridCellElement: React.FC<{
    element: SlideElement;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isSelected: boolean;
    index?: number;
    onSelect: () => void;
    onDelete: () => void;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>, elementId: string, layoutId: string) => void;
    onDragOver?: (e: React.DragEvent<HTMLDivElement>, elementId: string, layoutId: string, position: 'top' | 'bottom' | 'left' | 'right') => void;
    onDrop?: (e: React.DragEvent<HTMLDivElement>, elementId: string, layoutId: string, position: 'top' | 'bottom' | 'left' | 'right') => void;
    onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({
    element,
    presentationId,
    slideId,
    layoutId,
    isSelected,
    index,
    onSelect,
    onDelete,
    onDragStart,
    onDragOver,
    onDrop,
    onDragLeave
}) => {
        const { updateElement, updateLayout } = usePresentationStore();
        const { elementToFocus, clearElementToFocus } = useEditorStore();
        const dragHandleRef = useRef<HTMLDivElement>(null);
        const [isDragging, setIsDragging] = useState(false);
        const editorRef = useRef<HTMLDivElement>(null);
        
        // Create a ref for the Tiptap editor
        const tiptapRef = useRef<TiptapRef>(null);
        
        // Register this editor ref in the global registry
        useEffect(() => {
            const editorId = `${layoutId}-${element.id}`;
            editorRefs[editorId] = tiptapRef;
            
            return () => {
                // Clean up when unmounted
                delete editorRefs[editorId];
            };
        }, [layoutId, element.id]);

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
            const newLayoutId = generateId();
            const cellId = generateId();

            const defaultGridType = 'single-column';

            const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures('single-column');

            const firstNewEditorId = generateId();
            const elements: SlideElement[] = defaultLayoutGridStructure.rows.map(row => {
                return row.cells.map(cell => ({
                    id: firstNewEditorId,
                    type: 'editor',
                    textType: 'heading',
                    content: '',
                    position: { x: 0, y: 0 },
                    size: { width: 100, height: 100 },
                    style: {},
                    zIndex: 0,
                    cellId: cell.id,
                } as SlideElement))
            }).flat();

            const newLayout: Layout = {
                id: newLayoutId,
                gridStructure: defaultLayoutGridStructure,
                type: defaultGridType,
                style: {},
                elements,
            }

            // Add the new layout to the slide
            const updatedLayouts = [...slide.layouts];
            const currentLayoutIndex = updatedLayouts.findIndex(l => l.id === layoutId);
            updatedLayouts.splice(currentLayoutIndex + 1, 0, newLayout);

            // Update the slide with the new layouts
            usePresentationStore.getState().updateSlide(presentationId, slideId, {
                layouts: updatedLayouts
            });

            // Create a new editor element for the first cell of the new layout
            // const newEditor: Omit<TextElement, 'id'> = {
            //     type: 'editor',
            //     content: '',
            //     textType: 'heading',
            //     position: { x: 0, y: 0 },
            //     size: { width: 100, height: 40 },
            //     style: { fontSize: '16px', color: '#333333' },
            //     zIndex: 1,
            //     cellId: newLayout.gridStructure.rows[0].cells[0].id,
            // };

            // Add the new editor element to the new layout and get the new element ID
            // const newElementId = usePresentationStore.getState().addElement(
            //     presentationId, 
            //     slideId, 
            //     newLayoutId, 
            //     newEditor as any
            // );

            // Set the element to focus in the editor store
            useEditorStore.getState().setElementToFocus(
                firstNewEditorId,
                newLayoutId,
                newLayout.gridStructure.rows[0].cells[0].id
            );
        };

        // Effect to check if this element should be focused
        useEffect(() => {
            if (
                elementToFocus && 
                element.id === elementToFocus.elementId && 
                layoutId === elementToFocus.layoutId && 
                element.cellId === elementToFocus.cellId
            ) {
                // Clear the focus target immediately to prevent multiple focus attempts
                clearElementToFocus();
                
                // Select this element
                onSelect();
                
                // Use requestAnimationFrame to focus as soon as the browser is ready to paint
                // This ensures the focus happens at the earliest possible moment
                requestAnimationFrame(() => {
                    // Focus using the ref
                    if (tiptapRef.current) {
                        tiptapRef.current.focus();
                    }
                });
            }
        }, [element.id, layoutId, element.cellId, elementToFocus, clearElementToFocus, onSelect]);

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
                    // FIXME: этих типов недолжно быть
                    return (element as unknown as GridTextElement).content;
                case 'list':
                    // FIXME: этих типов недолжно быть
                    const listElement = element as unknown as GridListElement;
                    const listType = listElement.listType === 'bullet' ? 'ul' : 'ol';
                    const items = listElement.items.map(item => `<li>${item}</li>`).join('');
                    return `<${listType}>${items}</${listType}>`;
                case 'image':
                    // FIXME: этих типов недолжно быть
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

        // Обработчик для начала перетаскивания
        const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
            e.stopPropagation();
            setIsDragging(true);

            // Add the dragging class
            if (e.currentTarget.classList) {
                e.currentTarget.classList.add(styles.dragging);
            }

            // Set the drag data
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', element.id);

            // Call the parent's onDragStart handler if provided
            if (onDragStart) {
                onDragStart(e, element.id, layoutId);
            }
        };

        const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
            e.stopPropagation();
            setIsDragging(false);

            // Remove the dragging class
            if (e.currentTarget.classList) {
                e.currentTarget.classList.remove(styles.dragging);
            }
        };

        const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();

            // Set the drop effect
            e.dataTransfer.dropEffect = 'move';

            // Determine the drop position (top, bottom, left, right)
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top;  // y position within the element

            // Calculate the position based on which quadrant of the element the cursor is in
            const position = determineDropPosition(x, y, rect.width, rect.height);

            // Call the parent's onDragOver handler if provided
            if (onDragOver) {
                onDragOver(e, element.id, layoutId, position);
            }
        };

        // Helper function to determine the drop position
        const determineDropPosition = (x: number, y: number, width: number, height: number): 'top' | 'bottom' | 'left' | 'right' => {
            // Calculate distances from each edge
            const distanceFromTop = y;
            const distanceFromBottom = height - y;
            const distanceFromLeft = x;
            const distanceFromRight = width - x;

            // Find the minimum distance
            const minDistance = Math.min(distanceFromTop, distanceFromBottom, distanceFromLeft, distanceFromRight);

            // Return the position based on the minimum distance
            if (minDistance === distanceFromTop) return 'top';
            if (minDistance === distanceFromBottom) return 'bottom';
            if (minDistance === distanceFromLeft) return 'left';
            if (minDistance === distanceFromRight) return 'right';

            // Default to top if something goes wrong
            return 'top';
        };

        const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();

            // Determine the drop position
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const position = determineDropPosition(x, y, rect.width, rect.height);

            // Call the parent's onDrop handler if provided
            if (onDrop) {
                onDrop(e, element.id, layoutId, position);
            }
        };

        const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();

            // Call the parent's onDragLeave handler if provided
            if (onDragLeave) {
                onDragLeave(e);
            }
        };

        const placeholder = isSelected ? getPlaceholder() : '';
        
        return (
            <div
                className={`${styles.gridCell} ${isSelected ? styles.gridCellSelected : ''} ${isDragging ? styles.dragging : ''}`}
                onClick={onSelect}
                style={cellStyle}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragLeave={handleDragLeave}
                data-element-id={element.id}
                data-layout-id={layoutId}
                data-index={index}
                ref={editorRef}
            >
                <Tiptap
                    ref={tiptapRef}
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
                <span>{element.id}</span>

                <div
                    ref={dragHandleRef}
                    className={styles.dragHandle}
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <span className={styles.dragIcon}>⋮⋮</span>
                </div>
            </div>
        );
    };

export default GridCellElement;