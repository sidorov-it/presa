import { Tooltip as ChakraTooltip, Portal } from '@chakra-ui/react';
import { RefObject } from 'react';

export interface TooltipProps extends ChakraTooltip.RootProps {
    showArrow?: boolean;
    portalled?: boolean;
    portalRef?: React.RefObject<HTMLElement>;
    content: React.ReactNode;
    contentProps?: ChakraTooltip.ContentProps;
    disabled?: boolean;
    ref?: RefObject<HTMLDivElement>;
}

export default function Tooltip(props: TooltipProps) {
    const { showArrow, children, disabled, portalled = true, content, contentProps, ref, portalRef, ...rest } = props;

    if (disabled || !content) return children;

    return (
        <ChakraTooltip.Root openDelay={500} closeDelay={100} {...rest}>
            <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
            <Portal disabled={!portalled} container={portalRef}>
                <ChakraTooltip.Positioner>
                    <ChakraTooltip.Content ref={ref} {...contentProps}>
                        {showArrow && (
                            <ChakraTooltip.Arrow>
                                <ChakraTooltip.ArrowTip />
                            </ChakraTooltip.Arrow>
                        )}
                        {content}
                    </ChakraTooltip.Content>
                </ChakraTooltip.Positioner>
            </Portal>
        </ChakraTooltip.Root>
    );
}
