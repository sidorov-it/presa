import { Slider as ChakraSlider } from '@chakra-ui/react';
import { forwardRef } from 'react';

interface SliderProps {
    value?: number;
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    onChange?: (value: number) => void;
    onChangeEnd?: (value: number) => void;
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg';
    colorScheme?: string;
    disabled?: boolean;
    [key: string]: any;
}

export const Slider = forwardRef<HTMLDivElement, SliderProps>(
    (
        {
            value,
            defaultValue,
            min = 0,
            max = 100,
            step = 1,
            onChange,
            onChangeEnd,
            orientation = 'horizontal',
            size = 'md',
            colorScheme = 'blue',
            disabled = false,
            ...props
        },
        ref
    ) => {
        return (
            <ChakraSlider.Root
                ref={ref}
                value={value}
                defaultValue={defaultValue}
                min={min}
                max={max}
                step={step}
                onChange={onChange}
                orientation={orientation}
                size={size}
                colorScheme={colorScheme}
                disabled={disabled}
                {...props}
            >
                <ChakraSlider.Track>
                    <ChakraSlider.Range />
                </ChakraSlider.Track>
                <ChakraSlider.Thumb index={0} />
            </ChakraSlider.Root>
        );
    }
);

Slider.displayName = 'Slider';
