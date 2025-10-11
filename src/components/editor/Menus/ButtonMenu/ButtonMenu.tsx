'use client';
import { useState, useEffect } from 'react';
import FillIcon from './FillIcon';
import BorderedIcon from './BorderedIcon';
import { usePresentationStore } from '@/store/presentationStore';
import { ElementMenuProps } from '@/types';
import { RefObject } from 'react';

import styles from './ButtonMenu.module.css';
import ColorPicker from '@/components/ui/ColorPicker';

interface ButtonMenuProps extends ElementMenuProps {
    nodeAttributes: Record<string, any>;
    ref?: RefObject<HTMLDivElement>;
    alignment: 'left' | 'center' | 'right';
    onUpdate: (key: string, value: any) => void;
    onDelete: () => void;
    onAlignmentChange: (value: string) => void;
}

export default function ButtonMenu({
    slideId,
    layoutId,
    elementId,
    presentationId,
    nodeAttributes,
    alignment,
    ref,
    onUpdate,
    onDelete,
    onAlignmentChange,
}: ButtonMenuProps) {
    const [color, setColor] = useState(nodeAttributes.color || '#3C3939');
    const { updateElement } = usePresentationStore();

    const handleChangeAlignment = (value: string) => {
        onAlignmentChange(value);
    };

    // Используем локальное состояние для мгновенной обратной связи
    const handleChange = (key: string, value: any) => {
        if (key === 'color') {
            setColor(value);
        }

        // Обновляем атрибуты ноды через NodeView
        onUpdate(key, value);

        // Use the element ID from props or from node attributes as fallback
        const targetElementId = elementId || nodeAttributes.elementId;

        if (!targetElementId) {
            console.error('No element ID available for update in ButtonMenu');
            return;
        }

        // Обновляем состояние в store
        updateElement({
            presentationId,
            slideId,
            layoutId,
            elementId: targetElementId,
            data: { [key]: value },
        });
    };

    const handleDelete = () => {
        onDelete();
    };

    return (
        <div className={styles.buttonMenu} ref={ref}>
            {/* Link Input */}
            <div className={styles.fullWidth}>
                <input
                    type="text"
                    value={nodeAttributes.link || ''}
                    onChange={e => handleChange('link', e.target.value)}
                    placeholder="Вставьте ссылку"
                    className={styles.buttonMenuLinkInput}
                />
            </div>

            {/* Style Toggle */}
            <div className={styles.buttonMenuSetting}>
                <span className={styles.menuLabel}>Стиль кнопки</span>
                <div className={styles.menuButtons}>
                    <button
                        onClick={() => handleChange('buttonStyle', 'filled')}
                        className={`${styles.menuButton} ${nodeAttributes.buttonStyle === 'filled' ? styles.activeButton : ''}`}
                        aria-label="Стиль кнопки"
                    >
                        <FillIcon />
                    </button>
                    <button
                        onClick={() => handleChange('buttonStyle', 'outlined')}
                        className={`${styles.menuButton} ${nodeAttributes.buttonStyle === 'outlined' ? styles.activeButton : ''}`}
                        aria-label="Стиль кнопки"
                    >
                        <BorderedIcon />
                    </button>
                </div>
            </div>

            {/* Horizontal Alignment */}
            <div className={styles.buttonMenuSetting}>
                <span className={styles.menuLabel}>Выравнивание</span>
                <div className={styles.menuButtons}>
                    <button
                        onClick={() => handleChangeAlignment('left')}
                        className={`${styles.menuButton} ${!alignment || alignment === 'left' ? styles.activeButton : ''}`}
                        aria-label="Выравнивание"
                    >
                        <svg style={{ width: '1rem', height: '1rem' }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 3h18v2H3V3zm0 8h12v2H3v-2zm0 8h18v2H3v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleChangeAlignment('center')}
                        className={`${styles.menuButton} ${alignment === 'center' ? styles.activeButton : ''}`}
                        aria-label="Выравнивание"
                    >
                        <svg style={{ width: '1rem', height: '1rem' }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 3h18v2H3V3zm3 8h12v2H6v-2zm-3 8h18v2H3v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleChangeAlignment('right')}
                        className={`${styles.menuButton} ${alignment === 'right' ? styles.activeButton : ''}`}
                        aria-label="Выравнивание"
                    >
                        <svg style={{ width: '1rem', height: '1rem' }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 3h18v2H3V3zm6 8h12v2H9v-2zm-6 8h18v2H3v-2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Color Picker */}
            {/* <div className={styles.buttonMenuSetting}>
                <span className={styles.menuLabel}>Цвет</span>
                <div className={styles.colorPicker}>
                    <div className={styles.colorPreview} style={{ backgroundColor: color }} />
                    <input
                        type="text"
                        value={color}
                        onChange={e => handleChange('color', e.target.value)}
                        className={styles.colorInput}
                        aria-label="Цвет"
                    />
                </div>
            </div> */}

            <ColorPicker value={color} onChange={value => handleChange('color', value)} />

            {/* Delete Button */}
            <button onClick={handleDelete} className={styles.deleteButton} aria-label="Удалить">
                <svg className={styles.deleteButtonIcon} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                Удалить
            </button>
        </div>
    );
}
