import { Textarea as ChakraTextarea } from '@chakra-ui/react';
import { forwardRef } from 'react';

export interface TextareaProps {
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    variant?: 'outline' | 'filled' | 'flushed' | 'unstyled';
    isDisabled?: boolean;
    isInvalid?: boolean;
    isReadOnly?: boolean;
    isRequired?: boolean;
    resize?: 'none' | 'horizontal' | 'vertical' | 'both';
    errorBorderColor?: string;
    focusBorderColor?: string;
    onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
    [key: string]: any;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            value,
            defaultValue,
            placeholder,
            size = 'md',
            variant = 'outline',
            isDisabled = false,
            isInvalid = false,
            isReadOnly = false,
            isRequired = false,
            resize = 'vertical',
            errorBorderColor,
            focusBorderColor,
            onChange,
            onBlur,
            onFocus,
            ...props
        },
        ref
    ) => {
        return (
            <ChakraTextarea
                ref={ref}
                value={value}
                defaultValue={defaultValue}
                placeholder={placeholder}
                size={size}
                variant={variant}
                disabled={isDisabled}
                _invalid={isInvalid}
                readOnly={isReadOnly}
                required={isRequired}
                resize={resize}
                // errorBorderColor={errorBorderColor}
                // focusBorderColor={focusBorderColor}
                onChange={onChange}
                onBlur={onBlur}
                onFocus={onFocus}
                {...props}
            />
        );
    }
);

Textarea.displayName = 'Textarea';
