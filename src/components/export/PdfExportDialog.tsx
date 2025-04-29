import React, { useState } from 'react';
import {
    Button,
    Dialog,
    CloseButton,
    Portal,
    Input,
    VStack,
    HStack,
    useDisclosure,
    Checkbox,
    NumberInput,
    Select,
    Field,
    createListCollection,
} from '@chakra-ui/react';
import { FaFilePdf } from 'react-icons/fa';
import { IPresentation } from '@/types';
import { exportPresentationToPdf, PdfExportOptions } from '@/utils/pdfExport';

interface PdfExportDialogProps {
    presentation: IPresentation;
    buttonText?: string;
}

const PdfExportDialog: React.FC<PdfExportDialogProps> = ({ presentation, buttonText = 'Export to PDF' }) => {
    const { open, onOpen, onClose } = useDisclosure();
    const [isExporting, setIsExporting] = useState(false);

    // Export options
    const [filename, setFilename] = useState(`${presentation.title || 'presentation'}.pdf`);
    const [paperSize, setPaperSize] = useState<PdfExportOptions['paperSize']>('a4');
    const [orientation, setOrientation] = useState<PdfExportOptions['orientation']>('landscape');
    const [includeSlideNumbers, setIncludeSlideNumbers] = useState(true);
    const [scale, setScale] = useState(2);

    // Create collections for select components
    const paperSizeOptions = createListCollection({
        items: [
            { label: 'A4', value: 'a4' },
            { label: 'Letter', value: 'letter' },
            { label: 'Legal', value: 'legal' },
        ],
    });

    const orientationOptions = createListCollection({
        items: [
            { label: 'Landscape', value: 'landscape' },
            { label: 'Portrait', value: 'portrait' },
        ],
    });

    const handleExport = async () => {
        if (isExporting) return;

        try {
            setIsExporting(true);

            await exportPresentationToPdf(presentation, filename, {
                paperSize,
                orientation,
                includeSlideNumbers,
                scale,
            });

            // Show success toast (implementation will need to be adjusted based on your app's toast system)
            console.log('Export successful', `"${filename}" has been downloaded.`);

            onClose();
        } catch (error) {
            console.error('Error exporting presentation to PDF:', error);
            // Show error toast
            console.error('Export failed', 'An error occurred while exporting the presentation to PDF.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog.Root open={open}>
            <Dialog.Trigger asChild>
                <Button onClick={onOpen} colorScheme="blue" variant="solid" size="md">
                    <FaFilePdf style={{ marginRight: '8px' }} />
                    {buttonText}
                </Button>
            </Dialog.Trigger>

            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Export Presentation to PDF</Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>
                            <VStack gap="4" align="flex-start">
                                <Field.Root>
                                    <Field.Label>Filename</Field.Label>
                                    <Input
                                        value={filename}
                                        onChange={e => setFilename(e.target.value)}
                                        placeholder="Enter filename"
                                    />
                                </Field.Root>

                                <HStack width="100%" gap="4">
                                    <Field.Root>
                                        <Field.Label>Paper Size</Field.Label>
                                        <Select.Root
                                            collection={paperSizeOptions}
                                            defaultValue={[paperSize]}
                                            onValueChange={details => {
                                                if (details.value[0]) {
                                                    setPaperSize(details.value[0] as PdfExportOptions['paperSize']);
                                                }
                                            }}
                                        >
                                            <Select.Control>
                                                <Select.Trigger>
                                                    <Select.ValueText placeholder="Select paper size" />
                                                </Select.Trigger>
                                                <Select.IndicatorGroup>
                                                    <Select.Indicator />
                                                </Select.IndicatorGroup>
                                            </Select.Control>
                                            <Portal>
                                                <Select.Positioner>
                                                    <Select.Content>
                                                        {paperSizeOptions.items.map(option => (
                                                            <Select.Item key={option.value} item={option}>
                                                                {option.label}
                                                                <Select.ItemIndicator />
                                                            </Select.Item>
                                                        ))}
                                                    </Select.Content>
                                                </Select.Positioner>
                                            </Portal>
                                        </Select.Root>
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label>Orientation</Field.Label>
                                        <Select.Root
                                            collection={orientationOptions}
                                            defaultValue={[orientation]}
                                            onValueChange={details => {
                                                if (details.value[0]) {
                                                    setOrientation(details.value[0] as PdfExportOptions['orientation']);
                                                }
                                            }}
                                        >
                                            <Select.Control>
                                                <Select.Trigger>
                                                    <Select.ValueText placeholder="Select orientation" />
                                                </Select.Trigger>
                                                <Select.IndicatorGroup>
                                                    <Select.Indicator />
                                                </Select.IndicatorGroup>
                                            </Select.Control>
                                            <Portal>
                                                <Select.Positioner>
                                                    <Select.Content>
                                                        {orientationOptions.items.map(option => (
                                                            <Select.Item key={option.value} item={option}>
                                                                {option.label}
                                                                <Select.ItemIndicator />
                                                            </Select.Item>
                                                        ))}
                                                    </Select.Content>
                                                </Select.Positioner>
                                            </Portal>
                                        </Select.Root>
                                    </Field.Root>
                                </HStack>

                                <Field.Root>
                                    <Field.Label>Quality (Scale Factor)</Field.Label>
                                    <NumberInput.Root
                                        defaultValue={scale.toString()}
                                        min={1}
                                        max={5}
                                        step={0.5}
                                        onValueChange={details => {
                                            if (details.valueAsNumber !== undefined) {
                                                setScale(details.valueAsNumber);
                                            }
                                        }}
                                    >
                                        <NumberInput.Control>
                                            <NumberInput.Input />
                                            <NumberInput.IncrementTrigger />
                                            <NumberInput.DecrementTrigger />
                                        </NumberInput.Control>
                                    </NumberInput.Root>
                                </Field.Root>

                                <Field.Root>
                                    <Checkbox.Root
                                        defaultChecked={includeSlideNumbers}
                                        onCheckedChange={details => {
                                            if (typeof details.checked === 'boolean') {
                                                setIncludeSlideNumbers(details.checked);
                                            }
                                        }}
                                    >
                                        <Checkbox.Control>
                                            <Checkbox.Indicator />
                                        </Checkbox.Control>
                                        <Checkbox.Label>Include slide numbers</Checkbox.Label>
                                    </Checkbox.Root>
                                </Field.Root>
                            </VStack>
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.CloseTrigger asChild>
                                <Button variant="ghost" mr={3}>
                                    Cancel
                                </Button>
                            </Dialog.CloseTrigger>
                            <Button
                                colorScheme="blue"
                                onClick={handleExport}
                                disabled={isExporting}
                                loadingText="Exporting..."
                            >
                                Export
                            </Button>
                        </Dialog.Footer>

                        <Dialog.CloseTrigger asChild>
                            <CloseButton position="absolute" top="3" right="3" size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};

export default PdfExportDialog;
