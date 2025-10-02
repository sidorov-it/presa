'use client';
import SettingsSelector from '@/components/ui/SettingsSelector/SettingsSelector';

const DIRECTIONS = [
    { id: 'horizontal', label: 'Горизонтально' },
    { id: 'vertical', label: 'Вертикально' },
];

export default function SmartLayoutDirectionSelector({
    direction,
    setDirection,
}: {
    direction: 'horizontal' | 'vertical';
    setDirection: (value: 'horizontal' | 'vertical') => void;
}) {
    const handleSelect = (value: string) => {
        setDirection(value as 'horizontal' | 'vertical');
    };

    return <SettingsSelector value={direction} setValue={handleSelect} options={DIRECTIONS} />;
}
