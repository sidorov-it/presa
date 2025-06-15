import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Input } from '@/components/ui/Input/Input';
import { Popover } from '@/components/ui/Popover/Popover';
import { cn } from '@/lib/utils';
import { MdDeleteOutline } from 'react-icons/md';

import styles from './ColorPicker.module.css';

interface ColorPickerProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    allowAlpha?: boolean;
    isShowRemoveIcon?: boolean;
    handleRemove?: () => void;
}

export const ColorPicker = ({
    value,
    onChange,
    className,
    allowAlpha = false,
    isShowRemoveIcon = false,
    handleRemove,
}: ColorPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [alpha, setAlpha] = useState(1);

    useEffect(() => {
        if (allowAlpha) {
            const match = value.match(/^#([0-9A-Fa-f]{6})([0-9A-Fa-f]{2})?$/);
            if (match) {
                setInputValue(value);
                if (match[2]) {
                    setAlpha(parseInt(match[2], 16) / 255);
                } else {
                    setAlpha(1);
                }
            } else {
                setInputValue(value);
                setAlpha(1);
            }
        } else {
            setInputValue(value);
        }
    }, [value, allowAlpha]);

    const handleColorChange = (newColor: string) => {
        let finalColor = newColor;
        if (allowAlpha) {
            const alphaHex = Math.round(alpha * 255)
                .toString(16)
                .padStart(2, '0');
            finalColor = `${newColor}${alphaHex}`;
        }
        setInputValue(finalColor);
        onChange(finalColor);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        const regex = allowAlpha ? /^#([A-Fa-f0-9]{6})([A-Fa-f0-9]{2})?$/ : /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

        if (regex.test(newValue)) {
            if (allowAlpha) {
                const match = newValue.match(/^#([A-Fa-f0-9]{6})([A-Fa-f0-9]{2})?$/);
                if (match) {
                    setAlpha(match[2] ? parseInt(match[2], 16) / 255 : 1);
                }
            }
            onChange(newValue);
        }
    };

    const handleInputBlur = () => {
        const regex = allowAlpha ? /^#([A-Fa-f0-9]{6})([A-Fa-f0-9]{2})?$/ : /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!regex.test(inputValue)) {
            setInputValue(value);
        }
    };

    const colorButton = (
        <button
            type="button"
            className={styles.colorButton}
            style={{ backgroundColor: inputValue }}
            aria-label="Выбрать цвет"
            tabIndex={0}
        />
    );

    const baseColor = allowAlpha ? inputValue.slice(0, 7) : value;

    const colorPickerContent = (
        <div style={{ width: '100%' }}>
            <HexColorPicker
                color={baseColor}
                onChange={handleColorChange}
                data-testid="color-picker"
                className={styles.colorPicker}
            />
            <div className={styles.colorPickerContent}>
                <div className={styles.colorPickerButton} style={{ backgroundColor: inputValue }} />
                <Input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className={styles.colorPickerInput}
                    size="sm"
                    aria-label="Код цвета"
                />
                {allowAlpha && (
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={alpha}
                        onChange={e => {
                            const a = parseFloat(e.target.value);
                            setAlpha(a);
                            const alphaHex = Math.round(a * 255)
                                .toString(16)
                                .padStart(2, '0');
                            const base = inputValue.match(/^#([0-9A-Fa-f]{6})/);
                            if (base) {
                                const final = `#${base[1]}${alphaHex}`;
                                setInputValue(final);
                                onChange(final);
                            }
                        }}
                        aria-label="Прозрачность"
                        className={styles.alphaSlider}
                    />
                )}
            </div>
        </div>
    );

    return (
        <div className={cn(styles.colorPickerContainer, className)}>
            <Popover
                trigger={colorButton}
                content={colorPickerContent}
                isOpen={isOpen}
                onOpen={() => setIsOpen(true)}
                onClose={() => {
                    console.log('close');
                    setIsOpen(false);
                }}
            />
            <div style={{ position: 'relative', flex: '1 1 0%' }}>
                <Input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className={styles.colorPickerInput}
                    aria-label="Код цвета"
                />
                {isShowRemoveIcon && handleRemove && (
                    <button
                        type="button"
                        onClick={handleRemove}
                        className={styles.removeButton}
                        aria-label="Удалить цвет"
                        tabIndex={0}
                    >
                        <MdDeleteOutline className={styles.removeIcon} />
                    </button>
                )}
            </div>
        </div>
    );
};
