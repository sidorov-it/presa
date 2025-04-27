import React, { MutableRefObject } from 'react';
import { MenuItem } from '@/components/editor/SlideMenu/BaseMenu';
import SmartLayoutColumnSizeSelector from '@/components/settings/SmartLayoutColumnSizeSelector/SmartLayoutColumnSizeSelector';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement, ImageShape, TipTapRefs } from '@/types';
import SmartLayoutImageShapeSelector from '@/components/settings/SmartLayoutImageShapeSelector/SmartLayoutImageShapeSelector';
import SmartLayoutImageSizeSelector from '@/components/settings/SmartLayoutImageSizeSelector/SmartLayoutImageSizeSelector';
import styles from './SmartLayoutSettings.module.css';
import { BiAlignLeft, BiAlignMiddle, BiAlignRight } from 'react-icons/bi';
import { DeleteIcon } from '@/components/icons';
import SmartLayoutTemplateSelector from '@/components/settings/SmartLayoutTemplateSelector/SmartLayoutTemplateSelector';

interface SmartLayoutSettingsProps {
    slideId: string;
    layoutId: string;
    elementId: string;
    presentationId: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

const SmartLayoutSettings: React.FC<SmartLayoutSettingsProps> = ({
    slideId,
    layoutId,
    elementId,
    presentationId,
    tiptapRefs,
}) => {
    const element = usePresentationStore(
        state => state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement
    );

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
                setColumnSize={value => {
                    updateElement(presentationId, slideId, layoutId, elementId, {
                        ...element,
                        columnSize: value,
                    });
                }}
            />
            <SmartLayoutImageSizeSelector
                imageSize={element.imageSize || 1}
                setImageSize={value => {
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
            <div className={styles.alignmentGroup}>
                <button
                    onClick={() => handleAlignment('left')}
                    className={`${styles.button} ${element.align === 'left' ? styles.active : ''}`}
                    aria-label="По левому краю"
                >
                    <BiAlignLeft size={16} />
                </button>
                <button
                    onClick={() => handleAlignment('center')}
                    className={`${styles.button} ${element.align === 'center' ? styles.active : ''}`}
                    aria-label="По центру"
                >
                    <BiAlignMiddle size={16} />
                </button>
                <button
                    onClick={() => handleAlignment('right')}
                    className={`${styles.button} ${element.align === 'right' ? styles.active : ''}`}
                    aria-label="По правому краю"
                >
                    <BiAlignRight size={16} />
                </button>
            </div>

            <MenuItem
                icon={<DeleteIcon />}
                label="Удалить элемент"
                onClick={() => {
                    usePresentationStore.getState().deleteElement(presentationId, slideId, layoutId, elementId);
                }}
            />
        </>
    );
};

export default SmartLayoutSettings;
