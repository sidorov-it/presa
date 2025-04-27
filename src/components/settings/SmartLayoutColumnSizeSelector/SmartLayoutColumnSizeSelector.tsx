import { Slider } from '@chakra-ui/react';
import { FaColumns } from 'react-icons/fa';

export default function SmartLayoutColumnSizeSelector({
    columnSize,
    setColumnSize,
    step,
    min,
    max,
    defaultValue,
}: {
    columnSize: number;
    setColumnSize: (columnSize: number) => void;
    step: number;
    min: number;
    max: number;
    defaultValue: number;
}) {
    const reversedSize = max - columnSize;

    return (
        <div style={{ display: 'flex', gap: '10px' }}>
            <FaColumns size={16} />
            <Slider.Root
                width="60px"
                defaultValue={[defaultValue]}
                size="sm"
                variant="outline"
                step={step}
                min={min - step}
                max={max - step}
                value={[reversedSize]}
                onValueChange={e => setColumnSize(max - e.value[0])}
            >
                <Slider.Control>
                    <Slider.Track>
                        <Slider.Range />
                    </Slider.Track>
                    <Slider.Thumbs />
                </Slider.Control>
            </Slider.Root>
        </div>
    );
}
