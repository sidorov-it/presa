import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Input } from '@/components/ui/Input/Input';
import { Popover } from '@/components/ui/Popover';
import { cn } from '@/lib/utils';
import { MdDeleteOutline } from 'react-icons/md';

import styles from './ColorPicker.module.css';

interface ColorPickerProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    isShowRemoveIcon?: boolean;
    handleRemove?: () => void;
}

export const ColorPicker = ({
    value,
    onChange,
    className,
    isShowRemoveIcon = false,
    handleRemove,
}: ColorPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleColorChange = (newColor: string) => {
        setInputValue(newColor);
        onChange(newColor);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newValue)) {
            onChange(newValue);
        }
    };

    const handleInputBlur = () => {
        if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(inputValue)) {
            setInputValue(value);
        }
    };

    const colorButton = (
        <button
            type="button"
            className={styles.colorButton}
            style={{ backgroundColor: value }}
            aria-label="Выбрать цвет"
            tabIndex={0}
        />
    );

    const colorPickerContent = (
        <div style={{ width: '100%' }}>
            <HexColorPicker
                color={value}
                onChange={handleColorChange}
                data-testid="color-picker"
                className={styles.colorPicker}
            />
            <div className={styles.colorPickerContent}>
                <div className={styles.colorPickerButton} style={{ backgroundColor: value }} />
                <Input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className={styles.colorPickerInput}
                    size="sm"
                    aria-label="Код цвета"
                />
            </div>
        </div>
    );

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Popover
                trigger={colorButton}
                content={colorPickerContent}
                isOpen={isOpen}
                onOpen={() => setIsOpen(true)}
                onClose={() => setIsOpen(false)}
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
