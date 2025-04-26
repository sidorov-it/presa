import { Slider } from '@chakra-ui/react';
import { FaColumns } from 'react-icons/fa';

export default function SmartLayoutColumnSizeSelector({
    columnSize,
    setColumnSize,
}: {
    columnSize: number;
    setColumnSize: (columnSize: number) => void;
}) {
    const reversedSize = 24 - columnSize;

    return (
        <div style={{ display: 'flex', gap: '10px' }}>
            <FaColumns size={16} />
            <Slider.Root
                width="60px"
                defaultValue={[12]}
                size="sm"
                variant="outline"

                step={6}
                min={6}
                max={24}
                value={[reversedSize]}
                onValueChange={e => setColumnSize(24 - e.value[0])}
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
