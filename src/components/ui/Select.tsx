import {
    Select as ChakraSelect,
    // HiddenSelect,
    SelectLabel,
    SelectControl,
    SelectTrigger,
    SelectValueText,
    SelectIndicatorGroup,
    SelectIndicator,
    SelectContent,
    SelectItem,
    SelectItemIndicator,
    Portal,
    SelectPositioner,
    createListCollection,
} from '@chakra-ui/react';

const ChakraSelectRoot = ChakraSelect.Root;
interface SelectComponentProps {
    options: {
        value: string;
        label: string;
    }[];
    placeholder?: string;
    value?: string[];
    onValueChange?: (details: { value: string[] }) => void;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    variant?: 'outline' | 'subtle';
    label?: string;
    name?: string;
    onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    [key: string]: any;
}

export const Select = ({
    options,
    placeholder = 'Select option',
    value,
    onValueChange,
    label,
    size = 'md',
    variant = 'outline',
    name,
    onChange,
    ...props
}: SelectComponentProps) => {
    // Create collection from options
    const collection = createListCollection({
        items: options.map(option => ({
            label: option.label,
            value: option.value,
        })),
    });

    // Handle both controlled and uncontrolled usage
    const handleValueChange = (details: { value: string[] }) => {
        if (onValueChange) {
            onValueChange(details);
        }

        // Simulate onChange for compatibility with form libraries
        if (onChange && details.value.length > 0) {
            const syntheticEvent = {
                target: {
                    name,
                    value: details.value[0],
                },
                currentTarget: {
                    name,
                    value: details.value[0],
                },
            } as unknown as React.ChangeEvent<HTMLSelectElement>;

            onChange(syntheticEvent);
        }
    };

    return (
        <ChakraSelectRoot
            collection={collection}
            size={size}
            variant={variant}
            value={value}
            onValueChange={handleValueChange}
            {...props}
        >
            {/* {name && <HiddenSelect name={name} />} */}
            {label && <SelectLabel>{label}</SelectLabel>}
            <SelectControl>
                <SelectTrigger>
                    <SelectValueText placeholder={placeholder} />
                </SelectTrigger>
                <SelectIndicatorGroup>
                    <SelectIndicator />
                </SelectIndicatorGroup>
            </SelectControl>
            <Portal>
                <SelectPositioner>
                    <SelectContent>
                        {options.map(option => (
                            <SelectItem key={option.value} item={{ label: option.label, value: option.value }}>
                                {option.label}
                                <SelectItemIndicator />
                            </SelectItem>
                        ))}
                    </SelectContent>
                </SelectPositioner>
            </Portal>
        </ChakraSelectRoot>
    );
};
