'use client';

import React, { useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { usePresentationStore } from '@/store/presentationStore';
import { BoxElement } from '@/types';
import SettingsSelector from '@/components/ui/SettingsSelector/SettingsSelector';

import styles from './BoxBubbleMenu.module.css';

import { BaseMenu } from '../../../SlideMenu/BaseMenu';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import { useMenuStore } from '@/store/menuStore';
import { BoxCategories } from '@/elements/menuRegistry';
import DeleteIcon from '@/components/icons/DeleteIcon';
import { BoxIconOptions } from './BoxIconOptions';
interface BubbleMenuProps {
    editor: Editor;
    presentationId: string;
    slideId: string;
    layoutId: string;
    elementId: string;
}

const BoxBubbleMenu: React.FC<BubbleMenuProps> = ({ presentationId, slideId, layoutId, elementId }) => {
    const element = usePresentationStore(state =>
        state.getElement(presentationId, slideId, layoutId, elementId)
    ) as BoxElement;

    const elementConfig = useMemo(
        () => BoxCategories.elements.find(el => element.iconType === el.defaultProps.iconType),
        [element.iconType]
    );

    const updateElement = usePresentationStore(state => state.updateElement);
    const deleteElement = usePresentationStore(state => state.deleteElement);

    const handleIconChange = (iconType: string) => {
        if (element.customBackgroundColor) {
            updateElement(presentationId, slideId, layoutId, elementId, {
                iconType,
            });
        } else {
            const defaultBackgroundColor = elementConfig?.defaultProps?.backgroundColor;

            updateElement(presentationId, slideId, layoutId, elementId, {
                iconType,
                backgroundColor: defaultBackgroundColor,
            });
        }
    };

    const handleBackgroundColorChange = (color: string) => {
        updateElement(presentationId, slideId, layoutId, elementId, {
            customBackgroundColor: color,
        });
    };

    const handleDelete = () => {
        deleteElement(presentationId, slideId, layoutId, elementId);
        useMenuStore.getState().closeMenu();
    };

    return (
        <BaseMenu>
            <SettingsSelector value={element.iconType || 'box'} setValue={handleIconChange} options={BoxIconOptions} />

            <ColorPicker
                initialColor={element.backgroundColor || '#FFFFFF'}
                onColorChange={handleBackgroundColorChange}
                mode="icon"
                className={styles.button}
            />

            <button onClick={handleDelete} className={styles.deleteButton} aria-label="Delete box">
                <DeleteIcon />
            </button>
        </BaseMenu>
    );
};

export default BoxBubbleMenu;
