'use client';
import React from 'react';
import { ImageElement } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';

import styles from './ImageSettings.module.css';

interface ImageSettingsProps {
    elementId: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    onUpdate?: (updates: Partial<ImageElement>) => void;
}

const ImageSettings: React.FC<ImageSettingsProps> = ({ elementId, presentationId, slideId, layoutId }) => {
    const element = usePresentationStore(
        state => state.getElement(presentationId, slideId, layoutId, elementId) as ImageElement
    );

    const updateElement = usePresentationStore(state => state.updateElement);
    const deleteElement = usePresentationStore(state => state.deleteElement);
    const handleSrcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateElement(presentationId, slideId, layoutId, elementId, { src: e.target.value });
    };

    const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateElement(presentationId, slideId, layoutId, elementId, { alt: e.target.value });
    };

    const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
        updateElement(presentationId, slideId, layoutId, elementId, { alignment });
    };

    const handleDeleteElement = () => {
        // todo: нужно обработать все кейсы
        // 1. если это последний элемент на слайде, то нужно удалить слайд
        // 2. если это элемент в ячейке
        // 3. и тд
        deleteElement(presentationId, slideId, layoutId, elementId);
    };

    if (!element) return null;

    return (
        <div className={styles.imageSettings}>
            <div style={{ marginTop: '0.5rem' }}>
                <label htmlFor="image-url" className={styles.label}>
                    Адрес изображения
                </label>
                <input
                    id="image-url"
                    type="text"
                    className={styles.input}
                    value={element.src || ''}
                    onChange={handleSrcChange}
                    placeholder="https://example.com/image.jpg"
                />
            </div>

            <div style={{ marginTop: '0.5rem' }}>
                <label htmlFor="image-alt" className={styles.label}>
                    Альтернативный текст
                </label>
                <input
                    id="image-alt"
                    type="text"
                    className={styles.input}
                    value={element.alt || ''}
                    onChange={handleAltChange}
                    placeholder="Image description"
                />
            </div>

            <div style={{ marginTop: '0.5rem' }}>
                <label htmlFor="image-alignment" className={styles.label}>
                    Выравнивание
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        type="button"
                        className={`${styles.button} ${element.alignment === 'left' ? styles.buttonActive : ''}`}
                        onClick={() => handleAlignmentChange('left')}
                        aria-label="Align left"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && handleAlignmentChange('left')}
                    >
                        Слева
                    </button>
                    <button
                        type="button"
                        className={`${styles.button} ${element.alignment === 'center' ? styles.buttonActive : ''}`}
                        onClick={() => handleAlignmentChange('center')}
                        aria-label="Align center"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && handleAlignmentChange('center')}
                    >
                        По центру
                    </button>
                    <button
                        type="button"
                        className={`${styles.button} ${element.alignment === 'right' ? styles.buttonActive : ''}`}
                        onClick={() => handleAlignmentChange('right')}
                        aria-label="Align right"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && handleAlignmentChange('right')}
                    >
                        Справа
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
                <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleDeleteElement()}
                    aria-label="Удалить изображение"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleDeleteElement()}
                >
                    Удалить
                </button>
            </div>
        </div>
    );
};

export default ImageSettings;
