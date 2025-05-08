import Portal from './Portal';
import DropIndicator from './DropIndicator';
import { useDndStore } from '@/store/dndStore';

const DragDropIndicator = () => {
    const isDragging = useDndStore(state => state.state.dragState === 'dragging');

    if (!isDragging) return null;

    return (
        <Portal>
            <DropIndicator />
        </Portal>
    );
};

export default DragDropIndicator;
