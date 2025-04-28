'use client';

import React, { useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { usePresentationStore } from '@/store/presentationStore';
import { BoxElement } from '@/types';
import SettingsSelector from '@/components/ui/SettingsSelector/SettingsSelector';
import { BiTrash } from 'react-icons/bi';

import styles from './BoxBubbleMenu.module.css';

import {
    BsInfoCircle,
    BsExclamationTriangle,
    BsExclamationCircle,
    BsCheckCircle,
    BsQuestionCircle,
} from 'react-icons/bs';
import { MdNotes } from 'react-icons/md';
import { BaseMenu } from '../../../SlideMenu/BaseMenu';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import { useMenuStore } from '@/store/menuStore';
import { BoxCategories } from '@/elements/menuRegistry';

interface BubbleMenuProps {
    editor: Editor;
    presentationId: string;
    slideId: string;
    layoutId: string;
    elementId: string;
}

export const IconOptions = [
    {
        id: 'note-box',
        label: 'Заметка',
        Icon: MdNotes,
        defaultIconColor: '#3f3f5a',
    },
    {
        id: 'info-box',
        label: 'Информационный блок',
        Icon: BsInfoCircle,
        defaultIconColor: '#006ed6',
    },
    {
        id: 'warning-box',
        label: 'Предупреждение',
        Icon: BsExclamationTriangle,
        defaultIconColor: '#b29500',
    },
    {
        id: 'caution-box',
        label: 'Опасность',
        Icon: BsExclamationCircle,
        defaultIconColor: '#eb0000',
    },
    {
        id: 'success-box',
        label: 'Успех',
        Icon: BsCheckCircle,
        defaultIconColor: '#0c3f8d',
    },
    {
        id: 'question-box',
        label: 'Вопрос',
        Icon: BsQuestionCircle,
        defaultIconColor: '#7a7a7a',
    },
];

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
            <SettingsSelector value={element.iconType || 'box'} setValue={handleIconChange} options={IconOptions} />

            <ColorPicker
                initialColor={element.backgroundColor || '#FFFFFF'}
                onColorChange={handleBackgroundColorChange}
                mode="icon"
                className={styles.button}
            />

            <button onClick={handleDelete} className={styles.deleteButton} aria-label="Delete box">
                <BiTrash size={20} />
            </button>
        </BaseMenu>
    );
};

export default BoxBubbleMenu;
