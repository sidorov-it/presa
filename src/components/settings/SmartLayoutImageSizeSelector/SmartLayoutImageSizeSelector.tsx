import { Slider } from '@chakra-ui/react';
import { FaRegImage } from 'react-icons/fa';
export default function SmartLayoutColumnSizeSelector({
    imageSize,
    setImageSize,
}: {
    imageSize: number;
    setImageSize: (imageSize: number) => void;
}) {
    return (
        <div style={{ marginLeft: '10px', display: 'flex', gap: '10px' }}>
            <FaRegImage size={16} />
            <Slider.Root
                width="60px"
                defaultValue={[1]}
                step={1}
                size="sm"
                variant="outline"
                min={1}
                max={6}
                value={[imageSize]}
                onValueChange={e => setImageSize(e.value[0])}
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
