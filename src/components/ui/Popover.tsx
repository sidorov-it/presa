import * as React from 'react';
import { Popover as ChakraPopover, Portal, PopoverBody } from '@chakra-ui/react';
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
    return (
        <ChakraPopover.Root open={isOpen} onOpenChange={e => (e.open ? onOpen?.() : onClose?.())}>
            <ChakraPopover.Trigger asChild>{trigger}</ChakraPopover.Trigger>
            <Portal>
                <ChakraPopover.Positioner>
                    <ChakraPopover.Content
                        className={cn('z-50 w-64 rounded-md border bg-white shadow-md outline-none', className)}
                    >
                        <ChakraPopover.Arrow />
                        <PopoverBody>{content}</PopoverBody>
                    </ChakraPopover.Content>
                </ChakraPopover.Positioner>
            </Portal>
        </ChakraPopover.Root>
    );
};
