import { useDnd } from '@/contexts/DragDropContext';
import Portal from './Portal';
import DropIndicator from './DropIndicator';

const DragDropIndicator = () => {
    const { isDragging } = useDnd();
  
    if (!isDragging()) return null;
  
    return (
        <Portal>
            <DropIndicator />
        </Portal>
    );
};

export default DragDropIndicator; 