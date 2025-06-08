import { Button as ChakraButton } from '@chakra-ui/react';
import { forwardRef } from 'react';
import styles from './Button.module.css';

export interface ButtonProps {
    colorScheme?: string;
    variant?: 'solid' | 'outline' | 'ghost' | 'link' | 'subtle' | 'surface' | 'plain' | 'premium' | 'premium-subtle';
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
        // Если вариант premium, используем кастомную кнопку
        if (variant === 'premium') {
            return (
                <button
                    ref={ref}
                    className={`${styles.premiumButton} ${isDisabled ? styles.disabled : ''} ${
                        isLoading ? styles.loading : ''
                    }`}
                    onClick={onClick}
                    type={type}
                    disabled={isDisabled || isLoading}
                    {...props}
                >
                    <div className={styles.premiumButtonContent}>
                        {leftIcon && <span className={styles.premiumButtonIcon}>{leftIcon}</span>}
                        <span className={styles.premiumButtonText}>
                            {isLoading ? loadingText || 'Загрузка...' : children}
                        </span>
                        {rightIcon && <span className={styles.premiumButtonIcon}>{rightIcon}</span>}
                    </div>
                    <div className={styles.premiumButtonGlow}></div>
                </button>
            );
        }

        // Если вариант premium-subtle, используем более сдержанную кастомную кнопку
        if (variant === 'premium-subtle') {
            return (
                <button
                    ref={ref}
                    className={`${styles.premiumSubtleButton} ${isDisabled ? styles.disabled : ''} ${
                        isLoading ? styles.loading : ''
                    }`}
                    onClick={onClick}
                    type={type}
                    disabled={isDisabled || isLoading}
                    {...props}
                >
                    <div className={styles.premiumButtonContent}>
                        {leftIcon && <span className={styles.premiumSubtleIcon}>{leftIcon}</span>}
                        <span className={styles.premiumButtonText}>
                            {isLoading ? loadingText || 'Загрузка...' : children}
                        </span>
                        {rightIcon && <span className={styles.premiumSubtleIcon}>{rightIcon}</span>}
                    </div>
                </button>
            );
        }

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
