import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    size?: 'xs' | 'sm' | 'md' | 'lg';
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
            className,
            type = 'text',
            size = 'md',
            variant = 'outline',
            isDisabled,
            isInvalid,
            isReadOnly,
            isRequired,
            leftElement,
            rightElement,
            ...props
        },
        ref
    ) => {
        const sizeClasses = {
            xs: 'h-6 text-xs px-2',
            sm: 'h-8 text-sm px-3',
            md: 'h-10 text-base px-4',
            lg: 'h-12 text-lg px-4',
        };

        const variantClasses = {
            outline: 'border border-gray-300 bg-transparent',
            filled: 'border-0 bg-gray-100',
            flushed: 'border-0 border-b border-gray-300 rounded-none px-0',
            unstyled: 'border-0 px-0 bg-transparent',
        };

        const baseClasses = 'w-full rounded-md transition-colors duration-200';
        const stateClasses = cn('focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent', {
            'opacity-50 cursor-not-allowed': isDisabled,
            'border-red-500 focus:ring-red-500': isInvalid,
            'bg-gray-100': isReadOnly,
        });

        const inputClasses = cn(baseClasses, sizeClasses[size], variantClasses[variant], stateClasses, className);

        if (leftElement || rightElement) {
            return (
                <div className="relative flex items-center">
                    {leftElement && (
                        <div className="absolute left-3 flex items-center pointer-events-none">{leftElement}</div>
                    )}
                    <input
                        ref={ref}
                        type={type}
                        disabled={isDisabled}
                        readOnly={isReadOnly}
                        required={isRequired}
                        className={cn(inputClasses, {
                            'pl-10': leftElement,
                            'pr-10': rightElement,
                        })}
                        {...props}
                    />
                    {rightElement && (
                        <div className="absolute right-3 flex items-center pointer-events-none">{rightElement}</div>
                    )}
                </div>
            );
        }

        return (
            <input
                ref={ref}
                type={type}
                disabled={isDisabled}
                readOnly={isReadOnly}
                required={isRequired}
                className={inputClasses}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
