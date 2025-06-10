import { BaseMenu, MenuItem } from '@/components/editor/SlideMenu/BaseMenu';
import { AddColumnLeftIcon, AddColumnRightIcon, DeleteIcon, DuplicateIcon } from '@/components/icons';
import { usePresentationStore } from '@/store/presentationStore';
import { useMenuStore } from '@/store/menuStore';
import { CiImageOff } from 'react-icons/ci';
import { FiEdit3 } from 'react-icons/fi';

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

    const handleEditImage = () => {
        // Получаем текущее изображение из элемента
        const element = usePresentationStore.getState().getElement(presentationId, slideId, layoutId, elementId);
        const item = (element as any)?.items?.find((item: any) => item.id === itemId);
        const imageUrl = item?.imageUrl || '';

        useMenuStore.getState().closeMenu();
        useMenuStore.getState().openSideMenu('image-edit', {
            imageUrl,
            onClearImage: () => {
                usePresentationStore
                    .getState()
                    .removeImageFromSmartLayoutItem(presentationId, slideId, layoutId, elementId, itemId);
            },
            onUpdateLink: (link: string, uploaded: boolean) => {
                const currentElement = usePresentationStore
                    .getState()
                    .getElement(presentationId, slideId, layoutId, elementId);
                if (!currentElement) return;

                const updatedItems = (currentElement as any).items?.map((item: any) =>
                    item.id === itemId ? { ...item, imageUrl: link, uploaded } : item
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
            elementId,
            presentationId,
            slideId,
            layoutId,
            itemId,
        });
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
            <MenuItem icon={<FiEdit3 />} label="Редактировать изображение" onClick={handleEditImage} />
            <MenuItem icon={<CiImageOff color="red" />} label="Удалить изображение" onClick={handleRemoveImage} />
            <MenuItem icon={<DuplicateIcon />} label="Дублировать элемент" onClick={handleDuplicateItem} />
            <MenuItem icon={<DeleteIcon />} label="Удалить элемент" onClick={handleRemoveItem} />
        </BaseMenu>
    );
}
