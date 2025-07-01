'use client';
import SettingsSelector from '@/components/ui/SettingsSelector/SettingsSelector';

const SIDES_OPTIONS = [
    { id: 'one', label: 'Одна сторона' },
    { id: 'two', label: 'Две стороны' },
];

export default function TimelineSidesSelector({
    sides,
    setSides,
}: {
    sides: 'one' | 'two';
    setSides: (value: 'one' | 'two') => void;
}) {
    const handleSelect = (value: string) => {
        setSides(value as 'one' | 'two');
    };

    return <SettingsSelector value={sides} setValue={handleSelect} options={SIDES_OPTIONS} />;
} 