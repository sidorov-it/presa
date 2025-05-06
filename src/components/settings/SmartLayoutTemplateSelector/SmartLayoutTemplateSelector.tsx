import SettingsSelector from '@/components/ui/SettingsSelector/SettingsSelector';

const LAYOUT_TYPES = [
    {
        id: 'images-with-text',
        label: 'Изображения с текстом',
    },
    {
        id: 'text-boxes',
        label: 'Текстовые блоки',
    },
    {
        id: 'numbers',
        label: 'Numbers',
    },
    {
        id: 'grid',
        label: 'Grid',
    },
    {
        id: 'timeline',
        label: 'Timeline',
    },
];

export default function SmartLayoutTemplateSelector({
    elementVariant,
    setElementVariant,
}: {
    elementVariant: string;
    setElementVariant: (elementVariant: string) => void;
}) {
    return <SettingsSelector value={elementVariant} setValue={setElementVariant} options={LAYOUT_TYPES} />;
}
