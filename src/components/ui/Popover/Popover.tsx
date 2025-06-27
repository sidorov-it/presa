import * as React from 'react';
import { Popover as ChakraPopover, Portal, PopoverBody } from '@chakra-ui/react';
import { ColorMode, useColorMode } from '../color-mode';
import styles from './styles.module.css';
import { useEffect, useState } from 'react';

interface PopoverProps {
    trigger: React.ReactNode;
    content: React.ReactNode;
    isOpen?: boolean;
    className?: string;
    forceColorMode?: ColorMode;
    onOpen?: () => void;
    onClose?: () => void;
}

export const Popover = ({ className, trigger, content, isOpen, forceColorMode, onOpen, onClose }: PopoverProps) => {
    const { colorMode } = useColorMode();
    const [currentColorMode, setCurrentColorMode] = useState<ColorMode>(colorMode);

    useEffect(() => {
        if (forceColorMode) {
            setCurrentColorMode(forceColorMode);
        } else {
            setCurrentColorMode(colorMode);
        }
    }, [forceColorMode, colorMode]);

    return (
        <ChakraPopover.Root open={isOpen} onOpenChange={e => (e.open ? onOpen?.() : onClose?.())}>
            <ChakraPopover.Trigger asChild>{trigger}</ChakraPopover.Trigger>
            <Portal>
                <ChakraPopover.Positioner className={styles.popoverPositioner}>
                    <ChakraPopover.Content
                        className={`${styles.popover}${className ? ` ${className}` : ''}${currentColorMode === 'dark' ? ' dark' : ''}`}
                    >
                        {/* <ChakraPopover.Arrow /> */}
                        <PopoverBody>{content}</PopoverBody>
                    </ChakraPopover.Content>
                </ChakraPopover.Positioner>
            </Portal>
        </ChakraPopover.Root>
    );
};
