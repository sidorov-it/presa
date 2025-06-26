import { useState, useEffect, useMemo, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Input } from '@/components/ui/Input/Input';
import { Popover } from '@/components/ui/Popover/Popover';
import { MdDeleteOutline } from 'react-icons/md';

import styles from './ColorPicker.module.css';

interface ColorPickerProps {
    value: string;
    className?: string;
    allowAlpha?: boolean;
    isShowRemoveIcon?: boolean;
    placeholder?: string;
    handleRemove?: () => void;
    onChange: (value: string) => void;
}

// Utility functions to prevent rounding errors
const hexToAlpha = (hex: string): number => {
    if (hex.length === 2) {
        return parseInt(hex, 16) / 255;
    }
    return 1;
};

const alphaToHex = (alpha: number): string => {
    const value = Math.round(alpha * 255);
    return value.toString(16).padStart(2, '0');
};

const parseColorValue = (value: string) => {
    if (!value || !value.startsWith('#')) {
        return { baseColor: '#000000', alpha: 1, isValid: false };
    }

    const match = value.match(/^#([0-9A-Fa-f]{6})([0-9A-Fa-f]{2})?$/);
    if (match) {
        return {
            baseColor: `#${match[1]}`,
            alpha: match[2] ? hexToAlpha(match[2]) : 1,
            isValid: true,
        };
    }

    // Handle 3-digit hex colors
    const shortMatch = value.match(/^#([0-9A-Fa-f]{3})$/);
    if (shortMatch) {
        const expanded = shortMatch[1]
            .split('')
            .map(c => c + c)
            .join('');
        return {
            baseColor: `#${expanded}`,
            alpha: 1,
            isValid: true,
        };
    }

    return { baseColor: value, alpha: 1, isValid: false };
};

export const ColorPicker = ({
    value,
    className,
    allowAlpha = false,
    isShowRemoveIcon = false,
    placeholder = '',
    handleRemove,
    onChange,
}: ColorPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);

    // Parse initial value
    const parsedValue = useMemo(() => parseColorValue(value), [value]);
    const [inputValue, setInputValue] = useState(value);
    const [alpha, setAlpha] = useState(parsedValue.alpha);

    // Update local state only when external value changes significantly
    useEffect(() => {
        const currentParsed = parseColorValue(inputValue);
        const newParsed = parseColorValue(value);

        // Only update if the values are significantly different to prevent infinite loops
        const colorChanged = currentParsed.baseColor.toLowerCase() !== newParsed.baseColor.toLowerCase();
        const alphaChanged = allowAlpha && Math.abs(currentParsed.alpha - newParsed.alpha) > 0.01;

        if (colorChanged || alphaChanged || !currentParsed.isValid) {
            setInputValue(value);
            setAlpha(newParsed.alpha);
        }
    }, [value, allowAlpha, inputValue]);

    const handleColorChange = useCallback(
        (newColor: string) => {
            let finalColor = newColor;
            if (allowAlpha && alpha < 1) {
                const alphaHex = alphaToHex(alpha);
                finalColor = `${newColor}${alphaHex}`;
            }
            setInputValue(finalColor);
            onChange(finalColor);
        },
        [allowAlpha, alpha, onChange]
    );

    const handleAlphaChange = useCallback(
        (newAlpha: number) => {
            setAlpha(newAlpha);
            const parsed = parseColorValue(inputValue);
            let finalColor = parsed.baseColor;

            if (allowAlpha && newAlpha < 1) {
                const alphaHex = alphaToHex(newAlpha);
                finalColor = `${parsed.baseColor}${alphaHex}`;
            }

            setInputValue(finalColor);
            onChange(finalColor);
        },
        [allowAlpha, inputValue, onChange]
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setInputValue(newValue);

            const parsed = parseColorValue(newValue);
            if (parsed.isValid) {
                setAlpha(parsed.alpha);
                onChange(newValue);
            }
        },
        [onChange]
    );

    const handleInputBlur = useCallback(() => {
        const parsed = parseColorValue(inputValue);
        if (!parsed.isValid) {
            setInputValue(value);
            setAlpha(parseColorValue(value).alpha);
        }
    }, [inputValue, value]);

    const colorButton = useMemo(
        () => (
            <button
                type="button"
                className={styles.colorButton}
                style={{ backgroundColor: inputValue }}
                aria-label="Выбрать цвет"
                tabIndex={0}
            />
        ),
        [inputValue]
    );

    const baseColor = useMemo(() => {
        const parsed = parseColorValue(inputValue);
        return parsed.baseColor;
    }, [inputValue]);

    const colorPickerContent = useMemo(
        () => (
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
                            onChange={e => handleAlphaChange(parseFloat(e.target.value))}
                            aria-label="Прозрачность"
                            className={styles.alphaSlider}
                        />
                    )}
                </div>
            </div>
        ),
        [
            baseColor,
            inputValue,
            allowAlpha,
            alpha,
            handleColorChange,
            handleInputChange,
            handleInputBlur,
            handleAlphaChange,
        ]
    );

    return (
        <div className={`${styles.colorPickerContainer}${className ? ` ${className}` : ''}`}>
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
                    className={styles.colorPickerInput}
                    aria-label="Код цвета"
                    placeholder={placeholder}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
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
