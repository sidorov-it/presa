import { Tabs as ChakraTabs } from '@chakra-ui/react';
import { forwardRef } from 'react';

interface TabsComponentProps {
    items: {
        label: string;
        content: React.ReactNode;
    }[];
    variant?: 'line' | 'enclosed' | 'enclosed-colored' | 'soft-rounded' | 'solid-rounded';
    size?: 'sm' | 'md' | 'lg';
    colorScheme?: string;
    defaultIndex?: number;
    index?: number;
    onChange?: (index: number) => void;
    [key: string]: any;
}

export const Tabs = forwardRef<HTMLDivElement, TabsComponentProps>(
    ({ items, variant = 'line', size = 'md', colorScheme = 'blue', defaultIndex, index, onChange, ...props }, ref) => {
        return (
            <ChakraTabs.Root
                ref={ref}
                variant={variant}
                size={size}
                colorScheme={colorScheme}
                // defaultIndex={defaultIndex}
                // index={index}
                onChange={onChange}
                {...props}
            >
                <ChakraTabs.List>
                    {items.map((item: { label: string; content: React.ReactNode }, idx: number) => (
                        <ChakraTabs.Trigger key={idx} value={item.label}>
                            {item.label}
                        </ChakraTabs.Trigger>
                    ))}
                </ChakraTabs.List>
                {items.map((item: { label: string; content: React.ReactNode }, idx: number) => (
                    <ChakraTabs.Content value={item.label} key={idx}>
                        {item.content}
                    </ChakraTabs.Content>
                ))}
            </ChakraTabs.Root>
        );
    }
);

Tabs.displayName = 'Tabs';
