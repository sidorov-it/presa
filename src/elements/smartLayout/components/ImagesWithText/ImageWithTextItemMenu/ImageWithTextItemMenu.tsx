import { BaseMenu, MenuItem } from '@/components/editor/SlideMenu/BaseMenu';
import { AddColumnLeftIcon, AddColumnRightIcon, DeleteIcon, DuplicateIcon } from '@/components/icons';
import { usePresentationStore } from '@/store/presentationStore';
import { CiImageOff } from 'react-icons/ci';

export default function ImageWithTextItemMenu({
    presentationId,
    position,
    itemId,
    slideId,
    layoutId,
    elementId,
}: {
    presentationId: string;
    itemId: string;
    slideId: string;
    layoutId: string;
    elementId: string;
    position: { x: number; y: number };
}) {
    const handleRemoveImage = () => {
        usePresentationStore
            .getState()
            .removeImageFromSmartLayoutItem(presentationId, slideId, layoutId, elementId, itemId);
    };

    const handleRemoveItem = () => {
        usePresentationStore.getState().removeSmartLayoutItem(presentationId, slideId, layoutId, elementId, itemId);
    };

    const handleDuplicateItem = () => {
        usePresentationStore.getState().duplicateSmartLayoutItem(presentationId, slideId, layoutId, elementId, itemId);
    };

    const handleAddItemLeft = () => {
        usePresentationStore
            .getState()
            .addSmartLayoutItem(presentationId, slideId, layoutId, elementId, itemId, 'left');
    };

    const handleAddItemRight = () => {
        usePresentationStore
            .getState()
            .addSmartLayoutItem(presentationId, slideId, layoutId, elementId, itemId, 'right');
    };

    return (
        <BaseMenu position={position}>
            <MenuItem icon={<AddColumnLeftIcon />} label="Добавить элемент слева" onClick={handleAddItemLeft} />
            <MenuItem icon={<AddColumnRightIcon />} label="Добавить элемент справа" onClick={handleAddItemRight} />
            <MenuItem icon={<CiImageOff color="red" />} label="Удалить изображение" onClick={handleRemoveImage} />
            <MenuItem icon={<DuplicateIcon />} label="Дублировать элемент" onClick={handleDuplicateItem} />
            <MenuItem icon={<DeleteIcon />} label="Удалить элемент" onClick={handleRemoveItem} />
        </BaseMenu>
    );
}
