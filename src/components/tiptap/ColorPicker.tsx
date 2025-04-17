import { Editor } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { BiPalette } from 'react-icons/bi';
import styles from './ColorPicker.module.css';

// Пресеты цветов, можно настроить под ваши нужды
const COLOR_PRESETS = [
    '#000000', // Черный
    '#D32F2F', // Красный
    '#C2185B', // Розовый
    '#7B1FA2', // Пурпурный
    '#512DA8', // Темно-фиолетовый
    '#303F9F', // Индиго
    '#1976D2', // Синий
    '#0288D1', // Голубой
    '#0097A7', // Бирюзовый
    '#00796B', // Зеленый
    '#388E3C', // Светло-зеленый
    '#689F38', // Лаймовый
    '#AFB42B', // Желто-зеленый
    '#FBC02D', // Желтый
    '#FFA000', // Оранжевый
    '#F57C00', // Темно-оранжевый
    '#E64A19', // Красно-оранжевый
    '#5D4037', // Коричневый
    '#616161', // Серый
    '#455A64', // Сине-серый
    '#FFFFFF', // Белый
];

type ColorPickerMode = 'icon' | 'card';

export const ColorPicker = ({
    className,
    onColorChange,
    initialColor = '#000000',
    mode = 'icon',
    label = ''
}: {
    className?: string;
    onColorChange: (color: string) => void;
    initialColor?: string;
    mode?: ColorPickerMode;
    label?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentColor, setCurrentColor] = useState(initialColor);
    const [customColor, setCustomColor] = useState(initialColor);
    const colorPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Закрыть палитру по клику вне её области
        const handleClickOutside = (event: MouseEvent) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Обработка выбора цвета из пресетов
    const handleColorSelect = (color: string) => {
        setCurrentColor(color);
        onColorChange(color);
        setIsOpen(false);
    };

    // Обработка выбора цвета из палитры
    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomColor(e.target.value);
    };

    const handleCustomColorSelect = () => {
        setCurrentColor(customColor);
        onColorChange(customColor);
        setIsOpen(false);
    };

    const renderTriggerButton = () => {
        if (mode === 'icon') {
            return (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`${className || ''} ${styles.colorButton}`}
                    aria-label="Выбрать цвет текста"
                    aria-expanded={isOpen}
                    style={{ color: currentColor }}
                >
                    <BiPalette size={16} />
                    <span className={styles.colorIndicator} style={{ backgroundColor: currentColor }}></span>
                </button>
            );
        }
        
        return (
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${className || ''} ${styles.cardColorButton} flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm`}
                aria-label={label || "Выбрать цвет"}
                aria-expanded={isOpen}
            >
                <div className={`${styles.cardColorIndicator} w-4 h-4 rounded-sm`} style={{ backgroundColor: currentColor }}></div>
                <span>{currentColor}</span>
                <svg className="h-4 w-4 ml-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        );
    };

    return (
        <div className={`${styles.colorPickerContainer} light-theme-only`} ref={colorPickerRef}>
            {renderTriggerButton()}

            {isOpen && (
                <div className={`${styles.colorPopover} light-theme-only ${mode === 'card' ? styles.cardPopover : ''}`}>
                    <div className={styles.colorGrid}>
                        {COLOR_PRESETS.map(color => (
                            <button
                                key={color}
                                className={styles.colorPreset}
                                style={{ backgroundColor: color }}
                                onClick={() => handleColorSelect(color)}
                                aria-label={`Выбрать цвет ${color}`}
                            />
                        ))}
                    </div>

                    <div className={styles.customColorSection}>
                        <div className={styles.colorPickerLabel}>Выбрать цвет:</div>
                        <div className={styles.colorPickerControls}>
                            <input
                                type="color"
                                value={customColor}
                                onChange={handleCustomColorChange}
                                className={styles.colorInput}
                            />
                            <button onClick={handleCustomColorSelect} className={styles.applyColorButton}>
                                Применить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
