import { ColorPicker } from '../ui/ColorPicker/ColorPicker';
import { InfoIcon } from '../ui/InfoIcon';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';

import styles from './ThemeEditor.module.css';
import { Theme } from '@/types/theme';
import { ThemeColors } from '@/types/theme';

export default function Colors({
    theme,
    handleColorsChange,
}: {
    theme: Theme;
    handleColorsChange: (colors: Partial<ThemeColors>) => void;
}) {
    return (
        <div className="space-y-6 mt-4">
            <div className="space-y-4">
                <h3 className={styles.sectionTitle}>Цвета</h3>
                <h4 className={styles.sectionSubtitle}>
                    Палитра
                    <InfoIcon tooltip="Эти цвета появляются в палитре цветов при использовании этой темы. Основной акцентный цвет используется по умолчанию для ссылок, кнопок и других элементов." />
                </h4>

                <div className="space-y-4">
                    <div>
                        <Label>Основной акцентный цвет</Label>
                        <ColorPicker
                            value={theme.colors.primaryAccent}
                            onChange={color => handleColorsChange({ primaryAccent: color })}
                        />
                    </div>
                    <div>
                        <Label>Дополнительные цвета (необязательно)</Label>
                        <div className="flex gap-2">
                            {theme.colors.secondaryAccents.map((color, index) => (
                                <ColorPicker
                                    key={index}
                                    value={color}
                                    onChange={newColor => {
                                        const newSecondaryAccents = [...theme.colors.secondaryAccents];
                                        newSecondaryAccents[index] = newColor;
                                        handleColorsChange({
                                            secondaryAccents: newSecondaryAccents,
                                        });
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Текст</h3>
                <div className="space-y-4">
                    <div>
                        <Label>Цвет заголовков</Label>
                        <ColorPicker
                            value={theme.colors.headingColor}
                            onChange={color => handleColorsChange({ headingColor: color })}
                        />
                    </div>
                    <div>
                        <Label>Цвет текста</Label>
                        <ColorPicker
                            value={theme.colors.textColor}
                            onChange={color => handleColorsChange({ textColor: color })}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Фон</h3>
                <div className="space-y-4">
                    <div>
                        <Label>Цвет фона карточки</Label>
                        <ColorPicker
                            value={theme.colors.slideBackground}
                            onChange={color => handleColorsChange({ slideBackground: color })}
                        />
                    </div>
                    <div>
                        <Label>Цвет фона страницы</Label>
                        <div className="flex gap-2">
                            <Select
                                options={[
                                    { value: 'color', label: 'Сплошной цвет' },
                                    { value: 'image', label: 'Изображение' },
                                ]}
                                value={[theme.colors.pageBackground.type]}
                                onValueChange={({ value }: { value: string[] }) =>
                                    handleColorsChange({
                                        pageBackground: {
                                            ...theme.colors.pageBackground,
                                            type: value[0] as 'color' | 'image',
                                        },
                                    })
                                }
                            />
                            {theme.colors.pageBackground.type === 'color' ? (
                                <ColorPicker
                                    value={theme.colors.pageBackground.color}
                                    onChange={color =>
                                        handleColorsChange({
                                            pageBackground: {
                                                ...theme.colors.pageBackground,
                                                color,
                                            },
                                        })
                                    }
                                />
                            ) : (
                                <Input
                                    value={theme.colors.pageBackground.imageUrl}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        handleColorsChange({
                                            pageBackground: {
                                                ...theme.colors.pageBackground,
                                                imageUrl: e.target.value,
                                            },
                                        })
                                    }
                                    placeholder="Enter image URL"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
