import React from 'react';
import { cn } from '@/lib/utils';

export interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    className?: string;
    active?: boolean;
    color?: string;
    disabled?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    label,
    onClick,
    className,
    active,
    color,
    disabled = false
}) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === 'Space') {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <li>
            <button
                className={cn(
                    "w-9 h-9 rounded flex items-center justify-center transition-colors",
                    "hover:bg-[#f3f4f6] focus:bg-[#f3f4f6] focus:outline-none",
                    active && "bg-[#e5e7eb]",
                    color === "#f00" && " hover:bg-[#fee2e2] hover:text-[#ef4444]",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
                onClick={disabled ? undefined : onClick}
                aria-label={label}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={disabled ? undefined : handleKeyDown}
                title={label}
                disabled={disabled}
                style={color ? { color } : undefined}
            >
                <div className="flex items-center justify-center ">
                    {icon}
                </div>
            </button>
        </li>
    );
}; 