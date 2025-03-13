import { usePresentationStore } from '@/store/presentationStore';
import { EditorElement } from '@/types';
import Tiptap from '@/components/tiptap/Tiptap';
import styles from './GridCellElement.module.css';

// Компонент для отображения элемента в ячейке сетки
const GridCellElement: React.FC<{
    element: Element;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}> = ({ element, presentationId, slideId, layoutId, isSelected, onSelect, onDelete }) => {
    const { updateElement } = usePresentationStore();
    
    // Обработчик для изменения содержимого редактора
    const handleEditorContentChange = (content: string) => {
        if (element.type === 'editor') {
            updateElement(presentationId, slideId, layoutId, element.id, {
                content
            });
        }
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
        
        // Создаем новый элемент редактора
        const newEditor: Omit<EditorElement, 'id'> = {
            type: 'editor',
            content: '',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 40 },
            style: { fontSize: '16px', color: '#333333' },
            zIndex: 1,
            gridArea: 'content', // По умолчанию размещаем в области content
            placeholder: 'Введите текст...'
        };
        
        // Добавляем новый элемент в макет
        usePresentationStore.getState().addElement(presentationId, slideId, layoutId, newEditor);
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
    
    return (
        <div 
            className={`${styles.gridCell} ${isSelected ? styles.gridCellSelected : ''}`}
            onClick={onSelect}
            style={{ gridArea: element.gridArea }}
        >
            <Tiptap 
                id={element.id}
                initialContent={element.content}
                onEnterPressed={handleEnterPressed}
                onBackspacePressed={handleBackspacePressed}
                onFocus={onSelect}
                onContentChange={handleEditorContentChange}
                autoFocus={isSelected}
                placeholder={element.placeholder || 'Введите текст...'}
            />
        </div>
    );
    // Рендерим элемент в зависимости от его типа
    // switch (element.type) {
        
    //     case 'editor':
    //         return (
    //             <div 
    //                 className={`${styles.gridCell} ${isSelected ? styles.gridCellSelected : ''}`}
    //                 onClick={onSelect}
    //                 style={{ gridArea: element.gridArea }}
    //             >
    //                 <Tiptap 
    //                     id={element.id}
    //                     initialContent={element.content}
    //                     onEnterPressed={handleEnterPressed}
    //                     onBackspacePressed={handleBackspacePressed}
    //                     onFocus={onSelect}
    //                     onContentChange={handleEditorContentChange}
    //                     autoFocus={isSelected}
    //                     placeholder={element.placeholder || 'Введите текст...'}
    //                 />
    //             </div>
    //         );
    //     case 'heading':
    //     case 'paragraph':
    //     case 'text':
    //         return (
    //             <div 
    //                 className={`${styles.gridCell} ${isSelected ? styles.gridCellSelected : ''}`}
    //                 onClick={onSelect}
    //                 style={{ gridArea: element.gridArea }}
    //             >
    //                 <div 
    //                     className="text-content"
    //                     style={element.style}
    //                 >
    //                     {element.content}
    //                 </div>
    //             </div>
    //         );
    //     case 'list':
    //         return (
    //             <div 
    //                 className={`${styles.gridCell} ${isSelected ? styles.gridCellSelected : ''}`}
    //                 onClick={onSelect}
    //                 style={{ gridArea: element.gridArea }}
    //             >
    //                 {element.listType === 'bullet' ? (
    //                     <ul style={element.style}>
    //                         {element.items.map((item, index) => (
    //                             <li key={index}>{item}</li>
    //                         ))}
    //                     </ul>
    //                 ) : (
    //                     <ol style={element.style}>
    //                         {element.items.map((item, index) => (
    //                             <li key={index}>{item}</li>
    //                         ))}
    //                     </ol>
    //                 )}
    //             </div>
    //         );
    //     case 'image':
    //         return (
    //             <div 
    //                 className={`${styles.gridCell} ${isSelected ? styles.gridCellSelected : ''}`}
    //                 onClick={onSelect}
    //                 style={{ gridArea: element.gridArea }}
    //             >
    //                 <img 
    //                     src={element.src} 
    //                     alt={element.alt} 
    //                     style={{ 
    //                         width: '100%', 
    //                         height: '100%', 
    //                         objectFit: 'contain',
    //                         ...element.style 
    //                     }} 
    //                 />
    //             </div>
    //         );
    //     default:
    //         return (
    //             <div 
    //                 className={`${styles.gridCell} ${isSelected ? styles.gridCellSelected : ''}`}
    //                 onClick={onSelect}
    //                 style={{ gridArea: element.gridArea }}
    //             >
    //                 Неподдерживаемый тип элемента: {element.type}
    //             </div>
    //         );
    // }
};

export default GridCellElement;