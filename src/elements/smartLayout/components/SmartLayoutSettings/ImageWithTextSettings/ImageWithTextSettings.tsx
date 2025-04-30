import SmartLayoutColumnSizeSelector from '@/components/settings/SmartLayoutColumnSizeSelector/SmartLayoutColumnSizeSelector';
import SmartLayoutImageShapeSelector from '@/components/settings/SmartLayoutImageShapeSelector/SmartLayoutImageShapeSelector';
import SmartLayoutImageSizeSelector from '@/components/settings/SmartLayoutImageSizeSelector/SmartLayoutImageSizeSelector';
import SmartLayoutTemplateSelector from '@/components/settings/SmartLayoutTemplateSelector/SmartLayoutTemplateSelector';
import { usePresentationStore } from '@/store/presentationStore';
import {
    getPredefinedGridStructures,
    GridStructure,
    ImageShape,
    Layout,
    SmartLayoutElement,
    TipTapRefs,
} from '@/types';
import { MutableRefObject, useCallback } from 'react';
import { MenuItem } from '@/components/editor/SlideMenu/BaseMenu';
import AlignmentGroup from '@/components/settings/AlignmentGroup/AlignmentGroup';
import { DeleteIcon } from '@/components/icons';
import { generateId } from '@/utils/id';
import { getNewEditorElement } from '@/elements/registry';
import { useMenuStore } from '@/store/menuStore';

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

    const handleDeleteElement = useCallback(() => {
        const slide = usePresentationStore.getState().getSlide(presentationId, slideId);
        const layout = usePresentationStore.getState().getLayout(presentationId, slideId, layoutId);

        // если единственный элемент в слайде и лайауте, то добавляем новый элемент и удаляем старый
        // если не единственный в лайауте, то удаляем элемент
        // если не единственный в слайде, то удаляем лайаут

        if (layout?.elements && layout.elements.length === 1 && slide?.layouts && slide.layouts.length === 1) {
            //создаем новый лайаут с редактором и удаляем старый
            const newLayoutId = generateId(8);

            const defaultGridType = 'single-column';

            const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures(defaultGridType);

            const cellId = defaultLayoutGridStructure.rows[0].cells[0].id;

            const newElement = getNewEditorElement(cellId, '');

            const newLayout: Layout = {
                id: newLayoutId,
                gridStructure: defaultLayoutGridStructure,
                type: defaultGridType,
                style: {},
                elements: [newElement],
            };

            usePresentationStore.getState().addLayout(presentationId, slideId, newLayout);
            usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
            // usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
        } else if (layout?.elements && layout.elements.length > 1) {
            // удаляем элемент. на его место ставим новый редактор
            const newElement = getNewEditorElement(element.cellId, '');
            const updatedElements = [...layout.elements, newElement].filter(element => element.id !== elementId);

            usePresentationStore
                .getState()
                .updateLayout(presentationId, slideId, layoutId, { elements: updatedElements });
        } else {
            // удаляем лайаут
            usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
        }
        useMenuStore.getState().closeMenu();
    }, [presentationId, slideId, layoutId, element.cellId, elementId]);

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

            <MenuItem icon={<DeleteIcon />} label="Удалить элемент" onClick={handleDeleteElement} />
        </>
    );
}
