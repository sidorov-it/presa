import { BaseMenu, MenuItem } from '@/components/editor/SlideMenu/BaseMenu';
import { AddColumnLeftIcon, AddColumnRightIcon, DeleteIcon, DuplicateIcon } from '@/components/icons';
import { usePresentationStore } from '@/store/presentationStore';

export default function TimelineMenu({
    presentationId,
    position,
    itemId,
    slideId,
    layoutId,
    elementId,
    direction,
}: {
    presentationId: string;
    itemId: string;
    slideId: string;
    layoutId: string;
    elementId: string;
    position: { x: number; y: number };
    direction: 'horizontal' | 'vertical';
}) {
    const handleRemoveItem = () => {
        usePresentationStore.getState().removeSmartLayoutItem(presentationId, slideId, layoutId, elementId, itemId);
    };

    const handleDuplicateItem = () => {
        usePresentationStore.getState().duplicateSmartLayoutItem(presentationId, slideId, layoutId, elementId, itemId);
    };

    const handleAddItemBefore = () => {
        usePresentationStore
            .getState()
            .addSmartLayoutItem(presentationId, slideId, layoutId, elementId, itemId, 'left');
    };

    const handleAddItemAfter = () => {
        usePresentationStore
            .getState()
            .addSmartLayoutItem(presentationId, slideId, layoutId, elementId, itemId, 'right');
    };

    // const handleColorReset = useCallback(() => {
    //     const element = usePresentationStore
    //         .getState()
    //         .getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;

    //     if (!element) return;

    //     const updatedItems = element.items?.map(item => {
    //         if (item.id === itemId) {
    //             delete item.backgroundColor;
    //             delete item.textColor;
    //         }
    //         return item;
    //     });

    //     usePresentationStore.getState().updateElement({
    //         presentationId,
    //         slideId,
    //         layoutId,
    //         elementId,
    //         data: {
    //             items: updatedItems,
    //         },
    //     });
    // }, [presentationId, slideId, layoutId, elementId, itemId]);

    // const handleColorChange = useCallback(
    //     (color: string) => {
    //         const element = usePresentationStore
    //             .getState()
    //             .getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
    //         if (!element) return;

    //         // Calculate contrasting text color
    //         const textColor = getContrastingTextColor(color);

    //         // Update only the specific item's colors
    //         const updatedItems = element.items?.map(item =>
    //             item.id === itemId ? { ...item, backgroundColor: color, textColor } : item
    //         );

    //         usePresentationStore.getState().updateElement({
    //             presentationId,
    //             slideId,
    //             layoutId,
    //             elementId,
    //             data: {
    //                 items: updatedItems,
    //             },
    //         });
    //     },
    //     [presentationId, slideId, layoutId, elementId, itemId]
    // );

    // const element = usePresentationStore
    //     .getState()
    //     .getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;

    // const currentItem = element?.items?.find(item => item.id === itemId);

    // Determine labels based on direction
    const beforeLabel = direction === 'horizontal' ? 'Добавить элемент слева' : 'Добавить элемент выше';
    const afterLabel = direction === 'horizontal' ? 'Добавить элемент справа' : 'Добавить элемент ниже';

    return (
        <BaseMenu position={position}>
            <MenuItem icon={<AddColumnLeftIcon />} label={beforeLabel} onClick={handleAddItemBefore} />
            <MenuItem icon={<AddColumnRightIcon />} label={afterLabel} onClick={handleAddItemAfter} />
            <MenuItem icon={<DuplicateIcon />} label="Дублировать элемент" onClick={handleDuplicateItem} />
            {/* <ColorPicker
                mode="icon"
                onColorChange={handleColorChange}
                initialColor={currentItem?.backgroundColor || '#ffffff'}
                isShowResetColor={true}
                onColorReset={handleColorReset}
            /> */}
            <MenuItem icon={<DeleteIcon />} label="Удалить элемент" onClick={handleRemoveItem} />
        </BaseMenu>
    );
}
