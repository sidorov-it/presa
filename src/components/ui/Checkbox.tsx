'use client';

import { Checkbox as ChakraCheckbox } from '@chakra-ui/react';

export interface CheckboxProps {
    id?: string;
    name?: string;
    value?: string | number;
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    colorScheme?: string;
    size?: 'sm' | 'md' | 'lg';
    spacing?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
    children?: React.ReactNode;
    ref?: React.Ref<HTMLInputElement>;
    [key: string]: any;
}

export const Checkbox = ({
    id,
    name,
    value,
    checked,
    defaultChecked,
    disabled = false,
    required = false,
    invalid = false,
    colorScheme = 'blue',
    size = 'md',
    spacing,
    onChange,
    onBlur,
    onFocus,
    children,
    ref,
    ...props
}: CheckboxProps) => {
    return (
        <ChakraCheckbox.Root
            ref={ref}
            id={id}
            name={name}
            value={value}
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            required={required}
            invalid={invalid}
            colorScheme={colorScheme}
            size={size}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            {...props}
        >
            <ChakraCheckbox.Control>
                <ChakraCheckbox.Indicator />
            </ChakraCheckbox.Control>
            {children && <ChakraCheckbox.Label>{children}</ChakraCheckbox.Label>}
        </ChakraCheckbox.Root>
    );
};

Checkbox.displayName = 'Checkbox';
