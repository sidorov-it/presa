import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Input } from '@/components/ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/lib/utils';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ColorPicker = ({ value, onChange, className }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Update input value when external value changes
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
    
    // Only update the actual color if it's a valid hex color
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    // Revert to the valid value if the input is invalid
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(inputValue)) {
      setInputValue(value);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-10 h-10 rounded border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            style={{ backgroundColor: value }}
            aria-label="Выбрать цвет"
            tabIndex={0}
          />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-3">
            <HexColorPicker 
              color={value}
              onChange={handleColorChange}
              data-testid="color-picker"
              className={`${styles.colorPicker}`}
            />
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div 
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: value }}
                />
              </div>
              <Input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="flex-1"
                aria-label="Код цвета"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="flex-1"
        aria-label="Код цвета"
      />
    </div>
  );
}; 