import { BaseMenu, MenuItem } from '@/components/editor/SlideMenu/BaseMenu';
import { AddColumnLeftIcon, AddColumnRightIcon, DeleteIcon, DuplicateIcon } from '@/components/icons';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement } from '@/types';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import { useCallback } from 'react';
import { getContrastingTextColor } from '@/utils/themeUtils';

export default function TextBoxesMenu({
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

    const handleColorChange = useCallback(
        (color: string) => {
            const element = usePresentationStore
                .getState()
                .getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
            if (!element) return;

            // Calculate contrasting text color
            const textColor = getContrastingTextColor(color);

            // Update only the specific item's colors
            const updatedItems = element.items?.map(item =>
                item.id === itemId ? { ...item, backgroundColor: color, textColor } : item
            );

            usePresentationStore.getState().updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: {
                    items: updatedItems,
                },
            });
        },
        [presentationId, slideId, layoutId, elementId, itemId]
    );

    const element = usePresentationStore
        .getState()
        .getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;

    const currentItem = element?.items?.find(item => item.id === itemId);

    return (
        <BaseMenu position={position}>
            <MenuItem icon={<AddColumnLeftIcon />} label="Добавить элемент слева" onClick={handleAddItemLeft} />
            <MenuItem icon={<AddColumnRightIcon />} label="Добавить элемент справа" onClick={handleAddItemRight} />
            <MenuItem icon={<DuplicateIcon />} label="Дублировать элемент" onClick={handleDuplicateItem} />
            <ColorPicker
                mode="icon"
                onColorChange={handleColorChange}
                initialColor={currentItem?.backgroundColor || '#ffffff'}
            />
            <MenuItem icon={<DeleteIcon />} label="Удалить элемент" onClick={handleRemoveItem} />
        </BaseMenu>
    );
}
