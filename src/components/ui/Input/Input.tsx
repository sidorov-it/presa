import { forwardRef } from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    size?: 'xs' | 'sm' | 'md' | 'lg';
    // containerClassName?: string;
    variant?: 'outline' | 'filled' | 'flushed' | 'unstyled';
    isDisabled?: boolean;
    isInvalid?: boolean;
    isReadOnly?: boolean;
    isRequired?: boolean;
    errorBorderColor?: string;
    focusBorderColor?: string;
    leftElement?: React.ReactNode;
    rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            size = 'md',
            variant = 'outline',
            isInvalid,
            leftElement,
            rightElement,
            className,
            disabled,
            readOnly,
            ...props
        },
        ref
    ) => {
        const inputClasses = [
            styles.input,
            styles[size],
            styles[variant],
            isInvalid ? styles.invalid : '',
            disabled ? styles.disabled : '',
            readOnly ? styles.readonly : '',
            leftElement ? styles.hasLeftElement : '',
            rightElement ? styles.hasRightElement : '',
            className || '',
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={styles.wrapper}>
                {leftElement && <div className={styles.elementLeft}>{leftElement}</div>}
                <input ref={ref} disabled={disabled} readOnly={readOnly} className={inputClasses} {...props} />
                {rightElement && <div className={styles.elementRight}>{rightElement}</div>}
            </div>
        );
    }
);

Input.displayName = 'Input';
