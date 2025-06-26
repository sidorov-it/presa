import * as React from 'react';
import { Popover as ChakraPopover, Portal, PopoverBody } from '@chakra-ui/react';
import { useColorMode } from '../color-mode';
import styles from './styles.module.css';

interface PopoverProps {
    trigger: React.ReactNode;
    content: React.ReactNode;
    isOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
    className?: string;
}

export const Popover = ({ trigger, content, isOpen, onOpen, onClose, className }: PopoverProps) => {
    const { colorMode } = useColorMode();
    return (
        <ChakraPopover.Root open={isOpen} onOpenChange={e => (e.open ? onOpen?.() : onClose?.())}>
            <ChakraPopover.Trigger asChild>{trigger}</ChakraPopover.Trigger>
            <Portal>
                <ChakraPopover.Positioner className={styles.popoverPositioner}>
                    <ChakraPopover.Content className={`${styles.popover}${className ? ` ${className}` : ''}${colorMode === 'dark' ? ' dark' : ''}`}>
                        {/* <ChakraPopover.Arrow /> */}
                        <PopoverBody>{content}</PopoverBody>
                    </ChakraPopover.Content>
                </ChakraPopover.Positioner>
            </Portal>
        </ChakraPopover.Root>
    );
};
