import SmartLayoutColumnSizeSelector from '@/components/settings/SmartLayoutColumnSizeSelector/SmartLayoutColumnSizeSelector';
import SmartLayoutImageShapeSelector from '@/components/settings/SmartLayoutImageShapeSelector/SmartLayoutImageShapeSelector';
import SmartLayoutImageSizeSelector from '@/components/settings/SmartLayoutImageSizeSelector/SmartLayoutImageSizeSelector';
import SmartLayoutTemplateSelector from '@/components/settings/SmartLayoutTemplateSelector/SmartLayoutTemplateSelector';
import { usePresentationStore } from '@/store/presentationStore';
import { ImageShape, SmartLayoutElement, TipTapRefs } from '@/types';
import { MutableRefObject } from 'react';
import { MenuItem } from '@/components/editor/SlideMenu/BaseMenu';
import AlignmentGroup from '@/components/settings/AlignmentGroup/AlignmentGroup';
import { DeleteIcon } from '@/components/icons';

export default function ImageWithTextSettings({
    element,
    slideId,
    layoutId,
    elementId,
    presentationId,
    tiptapRefs,
}: {
    element: SmartLayoutElement;
    slideId: string;
    layoutId: string;
    elementId: string;
    presentationId: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}) {
    const updateElement = usePresentationStore(state => state.updateElement);

    const handleAlignment = (alignment: 'left' | 'center' | 'right') => {
        updateElement(presentationId, slideId, layoutId, elementId, {
            ...element,
            align: alignment,
        });

        element.items?.forEach(item => {
            tiptapRefs.current.editors[`title-${elementId}-${item.id}`]?.editor
                .chain()
                .focus()
                .setTextAlign(alignment)
                .blur()
                .run();

            tiptapRefs.current.editors[`text-${elementId}-${item.id}`]?.editor
                .chain()
                .focus()
                .setTextAlign(alignment)
                .blur()
                .run();
        });
    };
    return (
        <>
            <SmartLayoutTemplateSelector
                layoutType={element.layoutType || 'grid'}
                setLayoutType={value => {
                    updateElement(presentationId, slideId, layoutId, elementId, { ...element, layoutType: value });
                }}
            />
            <SmartLayoutColumnSizeSelector
                columnSize={element.columnSize}
                step={1}
                min={1}
                max={4}
                defaultValue={1}
                setColumnSize={value => {
                    console.log('setting column size', value);

                    updateElement(presentationId, slideId, layoutId, elementId, {
                        ...element,
                        columnSize: value,
                    });
                }}
            />
            <SmartLayoutImageSizeSelector
                imageSize={element.imageSize || 1}
                setImageSize={value => {
                    console.log('setting image size', value);
                    updateElement(presentationId, slideId, layoutId, elementId, {
                        ...element,
                        imageSize: value,
                    });
                }}
            />

            <SmartLayoutImageShapeSelector
                imageShape={element.imageShape || 'square'}
                setImageShape={value => {
                    updateElement(presentationId, slideId, layoutId, elementId, {
                        ...element,
                        imageShape: value as ImageShape,
                    });
                }}
            />

            <AlignmentGroup element={element} handleChange={handleAlignment} />

            <MenuItem
                icon={<DeleteIcon />}
                label="Удалить элемент"
                onClick={() => {
                    usePresentationStore.getState().deleteElement(presentationId, slideId, layoutId, elementId);
                }}
            />
        </>
    );
}
