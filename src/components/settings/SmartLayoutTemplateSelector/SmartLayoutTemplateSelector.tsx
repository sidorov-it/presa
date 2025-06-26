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
        id: 'steps',
        label: 'Шаги',
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
