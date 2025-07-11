import { useState, useRef, useEffect } from 'react';
import { BiPalette } from 'react-icons/bi';
import styles from './ColorPicker.module.css';
import { Button } from '../ui/Button';
import { RiResetLeftFill } from 'react-icons/ri';

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
    initialColor = '#000000',
    mode = 'icon',
    label = '',
    // customFooter,
    isShowResetColor = false,
    onColorChange,
    onColorReset,
}: {
    className?: string;
    initialColor?: string;
    mode?: ColorPickerMode;
    label?: string;
    // customFooter?: React.ReactNode;
    isShowResetColor?: boolean;
    onColorChange: (color: string) => void;
    onColorReset?: () => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentColor, setCurrentColor] = useState(initialColor);
    const [customColor, setCustomColor] = useState(initialColor);
    const [hexInput, setHexInput] = useState(initialColor);
    const [isHexValid, setIsHexValid] = useState(true);
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

    // Валидация hex-цвета
    const isValidHex = (hex: string) => {
        return /^#([0-9A-Fa-f]{6,8})$/.test(hex);
    };

    // Обработка выбора цвета из палитры
    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomColor(e.target.value);
        setHexInput(e.target.value);
        setIsHexValid(isValidHex(e.target.value));
    };

    // Обработка ручного ввода hex
    const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setHexInput(value);
        setIsHexValid(isValidHex(value));
        if (isValidHex(value)) {
            setCustomColor(value);
        }
    };

    const handleCustomColorSelect = () => {
        if (!isValidHex(hexInput)) {
            setIsHexValid(false);
            return;
        }
        setCurrentColor(hexInput);
        onColorChange(hexInput);
        setIsOpen(false);
    };

    // Синхронизируем hexInput при выборе цвета из пресета
    const handleColorSelect = (color: string) => {
        setCurrentColor(color);
        setCustomColor(color);
        setHexInput(color);
        setIsHexValid(true);
        onColorChange(color);
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
                    style={{ color: '#000000' }}
                >
                    <BiPalette size={16} />
                    <span className={styles.colorIndicator} style={{ backgroundColor: currentColor }}></span>
                </button>
            );
        }

        return (
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${className || ''} ${styles.cardColorButton}`}
                aria-label={label || 'Выбрать цвет'}
                aria-expanded={isOpen}
            >
                <div className={`${styles.cardColorIndicator}`} style={{ backgroundColor: currentColor }}></div>
                <span>{currentColor}</span>
                <svg
                    style={{ width: '1rem', height: '1rem' }}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
        );
    };

    const handlePresetClick = (event: React.MouseEvent<HTMLButtonElement>, color: string) => {
        event.stopPropagation();
        handleColorSelect(color);
    };

    return (
        <div className={`${styles.colorPickerContainer} light-theme-only`} ref={colorPickerRef}>
            {renderTriggerButton()}

            {isOpen && (
                <div
                    className={`${
                        styles.colorPopover
                    } light-theme-only ${mode === 'card' ? styles.cardPopover : ''} ${isShowResetColor ? styles.withFooter : ''}`}
                >
                    <div className={styles.colorGrid}>
                        {COLOR_PRESETS.map(color => (
                            <button
                                key={color}
                                className={styles.colorPreset}
                                style={{ backgroundColor: color }}
                                onClick={ev => handlePresetClick(ev, color)}
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
                                aria-label="Выбрать цвет на палитре"
                            />
                            <input
                                type="text"
                                value={hexInput}
                                onChange={handleHexInputChange}
                                className={`${styles.hexInput} ${isHexValid ? '' : styles.invalidHexInput}`}
                                aria-label="Ввести hex-значение цвета"
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleCustomColorSelect();
                                }}
                                maxLength={7}
                                placeholder="#000000"
                            />
                            <Button
                                className={styles.applyColorButton}
                                aria-label="Применить выбранный цвет"
                                variant="secondary"
                                onClick={handleCustomColorSelect}
                            >
                                Применить
                            </Button>
                        </div>
                        {!isHexValid && (
                            <div
                                style={{
                                    marginTop: '0.25rem',
                                    fontSize: '0.75rem',
                                    lineHeight: '1rem',
                                    color: '#EF4444',
                                }}
                                role="alert"
                            >
                                Введите корректный hex-цвет (#RRGGBB)
                            </div>
                        )}
                    </div>

                    {isShowResetColor && (
                        <div className={styles.customFooter}>
                            <button
                                onClick={onColorReset}
                                className={styles.resetColorButton}
                                aria-label="Сбросить цвет"
                            >
                                <RiResetLeftFill />
                                Сбросить цвет
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
