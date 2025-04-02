import { Editor } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";
import { BiPalette } from "react-icons/bi";
import styles from "./ColorPicker.module.css";

// Пресеты цветов, можно настроить под ваши нужды
const COLOR_PRESETS = [
    "#000000", // Черный
    "#D32F2F", // Красный
    "#C2185B", // Розовый
    "#7B1FA2", // Пурпурный
    "#512DA8", // Темно-фиолетовый
    "#303F9F", // Индиго
    "#1976D2", // Синий
    "#0288D1", // Голубой
    "#0097A7", // Бирюзовый
    "#00796B", // Зеленый
    "#388E3C", // Светло-зеленый
    "#689F38", // Лаймовый
    "#AFB42B", // Желто-зеленый
    "#FBC02D", // Желтый
    "#FFA000", // Оранжевый
    "#F57C00", // Темно-оранжевый
    "#E64A19", // Красно-оранжевый
    "#5D4037", // Коричневый
    "#616161", // Серый
    "#455A64", // Сине-серый
    "#FFFFFF", // Белый
];

export const ColorPicker = ({ editor, className }: { editor: Editor; className?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentColor, setCurrentColor] = useState("#000000");
    const [customColor, setCustomColor] = useState("#000000");
    const colorPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
    // Закрыть палитру по клику вне её области
        const handleClickOutside = (event: MouseEvent) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Обработка выбора цвета из пресетов
    const handleColorSelect = (color: string) => {
        setCurrentColor(color);
        editor.chain().focus().setColor(color).run();
        setIsOpen(false);
    };

    // Обработка выбора цвета из палитры
    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomColor(e.target.value);
    };

    const handleCustomColorSelect = () => {
        setCurrentColor(customColor);
        editor.chain().focus().setColor(customColor).run();
        setIsOpen(false);
    };

    return (
        <div className={styles.colorPickerContainer} ref={colorPickerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${className || ""} ${styles.colorButton}`}
                aria-label="Выбрать цвет текста"
                aria-expanded={isOpen}
                style={{ color: currentColor }}
            >
                <BiPalette size={16} />
                <span className={styles.colorIndicator} style={{ backgroundColor: currentColor }}></span>
            </button>

            {isOpen && (
                <div className={styles.colorPopover}>
                    <div className={styles.colorGrid}>
                        {COLOR_PRESETS.map((color) => (
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
                            <button
                                onClick={handleCustomColorSelect}
                                className={styles.applyColorButton}
                            >
                Применить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};