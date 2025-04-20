import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

interface PopoverProps {
    trigger: React.ReactNode;
    content: React.ReactNode;
    isOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
    className?: string;
}

export const Popover = ({ trigger, content, isOpen, onOpen, onClose, className }: PopoverProps) => {
    const handleOpenChange = (open: boolean) => {
        if (open) {
            onOpen?.();
        } else {
            onClose?.();
        }
    };

    return (
        <PopoverPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    className={cn(
                        'z-50 w-64 rounded-md border bg-white p-4 shadow-md outline-none',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                        'data-[side=bottom]:slide-in-from-top-2',
                        'data-[side=left]:slide-in-from-right-2',
                        'data-[side=right]:slide-in-from-left-2',
                        'data-[side=top]:slide-in-from-bottom-2',
                        className
                    )}
                    sideOffset={5}
                >
                    {content}
                    <PopoverPrimitive.Arrow />
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
};
