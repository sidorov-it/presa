'use client';

import React, { useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { usePresentationStore } from '@/store/presentationStore';
import { BoxElement } from '@/types';
import SettingsSelector from '@/components/ui/SettingsSelector/SettingsSelector';

import { ColorPicker } from '@/components/tiptap/ColorPicker';
import { useMenuStore } from '@/store/menuStore';
import DeleteIcon from '@/components/icons/DeleteIcon';

import { BoxIconOptions } from './BoxIconOptions';

import styles from './BoxBubbleMenu.module.css';
import { ElementRegistry } from '@/elements/commonRegisrty';
import { RiResetLeftFill } from 'react-icons/ri';

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
        () => Object.values(ElementRegistry).find(el => element.iconType === el.props.iconType),
        [element.iconType]
    );

    const updateElement = usePresentationStore(state => state.updateElement);
    const deleteElement = usePresentationStore(state => state.deleteElement);

    const handleIconChange = (iconType: string) => {
        if (iconType === 'without-icon') {
            updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: {
                    iconType,
                },
            });
        } else if (element.customBackgroundColor) {
            updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: {
                    iconType,
                },
            });
        } else {
            const defaultBackgroundColor = elementConfig?.props?.backgroundColor;

            updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: {
                    iconType,
                    backgroundColor: defaultBackgroundColor,
                },
            });
        }
    };

    const handleResetColor = useCallback(() => {
        const defaultBackgroundColor = elementConfig?.props?.backgroundColor;

        updateElement({
            presentationId,
            slideId,
            layoutId,
            elementId,
            data: {
                customBackgroundColor: undefined,
                backgroundColor: defaultBackgroundColor,
            },
        });
    }, [elementConfig, presentationId, slideId, layoutId, elementId, updateElement]);

    const handleBackgroundColorChange = (color: string) => {
        updateElement({
            presentationId,
            slideId,
            layoutId,
            elementId,
            data: {
                customBackgroundColor: color,
            },
        });
    };

    const handleDelete = () => {
        deleteElement(presentationId, slideId, layoutId, elementId);
        useMenuStore.getState().closeMenu();
    };

    return (
        <>
            <SettingsSelector value={element.iconType || 'box'} setValue={handleIconChange} options={BoxIconOptions} />

            <ColorPicker
                initialColor={element.backgroundColor || '#FFFFFF'}
                onColorChange={handleBackgroundColorChange}
                mode="icon"
                className={styles.button}
                customFooter={
                    <button onClick={handleResetColor} className={styles.resetColorButton} aria-label="Удалить блок">
                        <RiResetLeftFill />
                        Сбросить цвет
                    </button>
                }
            />

            <button onClick={handleDelete} className={styles.deleteButton} aria-label="Удалить блок">
                <DeleteIcon />
            </button>
        </>
    );
};

export default BoxBubbleMenu;
