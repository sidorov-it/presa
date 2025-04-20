import { Button as ChakraButton } from '@chakra-ui/react';
import { forwardRef } from 'react';

export interface ButtonProps {
    colorScheme?: string;
    variant?: 'solid' | 'outline' | 'ghost' | 'link' | 'subtle' | 'surface' | 'plain';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    isDisabled?: boolean;
    leftIcon?: React.ReactElement;
    rightIcon?: React.ReactElement;
    loadingText?: string;
    spinnerPlacement?: 'start' | 'end';
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    type?: 'button' | 'submit' | 'reset';
    children?: React.ReactNode;
    [key: string]: any;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'solid',
            size = 'md',
            isLoading = false,
            isDisabled = false,
            leftIcon,
            rightIcon,
            loadingText,
            spinnerPlacement = 'start',
            onClick,
            type = 'button',
            children,
            ...props
        },
        ref
    ) => {
        return (
            <ChakraButton
                ref={ref}
                variant={variant}
                size={size}
                loading={isLoading}
                disabled={isDisabled}
                loadingText={loadingText}
                spinnerPlacement={spinnerPlacement}
                onClick={onClick}
                type={type}
                {...props}
            >
                {children}
            </ChakraButton>
        );
    }
);

Button.displayName = 'Button';

export { Button };
