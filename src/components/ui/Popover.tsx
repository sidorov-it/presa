import {
    Popover as ChakraPopover,
    PopoverTrigger as ChakraPopoverTrigger,
    PopoverContent as ChakraPopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverFooter,
    PopoverArrow,
    // PopoverCloseButton,
} from '@chakra-ui/react';
import { useState } from 'react';

interface PopoverProps {
    trigger: React.ReactNode;
    content: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    isOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
    placement?: 'top' | 'right' | 'bottom' | 'left';
    closeOnBlur?: boolean;
    closeOnEsc?: boolean;
    isLazy?: boolean;
    [key: string]: any;
}

export const Popover = ({
    trigger,
    content,
    header,
    footer,
    isOpen,
    onOpen,
    onClose,
    // placement = 'bottom',
    // closeOnBlur = true,
    // closeOnEsc = true,
    // isLazy = false,
    ...props
}: PopoverProps) => {
    const [open, setOpen] = useState(isOpen);

    return (
        <ChakraPopover.Root
            open={open}
            onOpenChange={e => setOpen(e.open)}
            // positioning={placement as PositioningOptions}
            // closeOnBlur={closeOnBlur}
            // closeOnEsc={closeOnEsc}
            // isLazy={isLazy}
            {...props}
        >
            <ChakraPopoverTrigger>{trigger}</ChakraPopoverTrigger>
            <ChakraPopoverContent>
                <PopoverArrow />
                {/* <PopoverCloseButton /> */}
                {header && <PopoverHeader>{header}</PopoverHeader>}
                <PopoverBody>{content}</PopoverBody>
                {footer && <PopoverFooter>{footer}</PopoverFooter>}
            </ChakraPopoverContent>
        </ChakraPopover.Root>
    );
};
