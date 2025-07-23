'use client';

import React from 'react';
import { HeaderFooterConfig, HeaderFooterContentType, HeaderFooterPosition } from '@/types';
import SettingsSelector from '@/components/ui/SettingsSelector/SettingsSelector';
import styles from './HeaderFooterPositionSettings.module.css';

interface HeaderFooterPositionSettingsProps {
    config: HeaderFooterConfig;
    onChange: (config: HeaderFooterConfig) => void;
    currentSlideIndex: number;
    totalSlides: number;
}

const CONTENT_TYPES = [
    { id: 'none', label: 'Пусто' },
    { id: 'text', label: 'Текст' },
    { id: 'logo', label: 'Логотип' },
    { id: 'slide-number', label: 'Номер слайда' },
];

const POSITION_LABELS = {
    left: 'Слева',
    center: 'По центру',
    right: 'Справа',
};

const HeaderFooterPositionSettings: React.FC<HeaderFooterPositionSettingsProps> = ({
    config,
    onChange,
    currentSlideIndex,
    totalSlides,
}) => {
    const handlePositionChange = (
        position: 'left' | 'center' | 'right',
        updates: Partial<HeaderFooterPosition>
    ) => {
        onChange({
            ...config,
            [position]: {
                ...config[position],
                ...updates,
            },
        });
    };

    const handleTypeChange = (position: 'left' | 'center' | 'right', type: string) => {
        const newType = type as HeaderFooterContentType;
        let content = '';
        
        // Set default content based on type
        if (newType === 'slide-number') {
            content = `${currentSlideIndex + 1} / ${totalSlides}`;
        }
        
        handlePositionChange(position, { type: newType, content });
    };

    const handleContentChange = (position: 'left' | 'center' | 'right', content: string) => {
        handlePositionChange(position, { content });
    };

    const renderPositionSettings = (position: 'left' | 'center' | 'right') => {
        const positionConfig = config[position];
        
        return (
            <div className={styles.positionGroup} key={position}>
                <label className={styles.positionLabel}>{POSITION_LABELS[position]}</label>
                
                <SettingsSelector
                    value={positionConfig.type}
                    setValue={(type) => handleTypeChange(position, type)}
                    options={CONTENT_TYPES}
                />

                {positionConfig.type === 'text' && (
                    <div className={styles.textInput}>
                        <input
                            type="text"
                            placeholder="Введите текст"
                            value={positionConfig.content || ''}
                            onChange={(e) => handleContentChange(position, e.target.value)}
                            className={styles.input}
                        />
                    </div>
                )}

                {positionConfig.type === 'logo' && (
                    <div className={styles.logoInput}>
                        <input
                            type="url"
                            placeholder="URL логотипа"
                            value={positionConfig.content || ''}
                            onChange={(e) => handleContentChange(position, e.target.value)}
                            className={styles.input}
                        />
                        <small className={styles.hint}>
                            Вставьте ссылку на изображение логотипа
                        </small>
                    </div>
                )}

                {positionConfig.type === 'slide-number' && (
                    <div className={styles.slideNumberPreview}>
                        <span className={styles.preview}>
                            Показывается как: {currentSlideIndex + 1} / {totalSlides}
                        </span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.positionsContainer}>
                {renderPositionSettings('left')}
                {renderPositionSettings('center')}
                {renderPositionSettings('right')}
            </div>
        </div>
    );
};

export default HeaderFooterPositionSettings; 