import { ColorPicker } from '../../ui/ColorPicker/ColorPicker';
import { InfoIcon } from '../../ui/InfoIcon';
import { Label } from '../../ui/Label';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input/Input';

import { Theme } from '@/types/theme';
import { ThemeColors } from '@/types/theme';
import { Button } from '../../ui/Button';
import styles from '../ThemeEditor.module.css';

export default function Colors({
    theme,
    handleColorsChange,
}: {
    theme: Theme;
    handleColorsChange: (colors: Partial<ThemeColors>) => void;
}) {
    return (
        <div style={{ marginTop: '16px', width: '100%' }}>
            <div>
                <h3 className={styles.sectionTitle}>Цвета</h3>
                <h4 className={styles.sectionSubtitle}>
                    Палитра
                    <InfoIcon tooltip="Эти цвета появляются в палитре цветов при использовании этой темы. Основной акцентный цвет используется по умолчанию для ссылок, кнопок и других элементов." />
                </h4>

                <div
                    style={{
                        marginTop: '1rem',
                    }}
                >
                    <div>
                        <Label>Основной акцентный цвет</Label>
                        <ColorPicker
                            value={theme.colors.primaryAccent}
                            onChange={color => handleColorsChange({ primaryAccent: color })}
                        />
                    </div>
                    <div>
                        <Label>Дополнительные цвета (необязательно)</Label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {theme.colors.secondaryAccents.map((color, index) => (
                                <ColorPicker
                                    key={index}
                                    value={color}
                                    isShowRemoveIcon={true}
                                    onChange={newColor => {
                                        const newSecondaryAccents = [...theme.colors.secondaryAccents];
                                        newSecondaryAccents[index] = newColor;
                                        handleColorsChange({
                                            secondaryAccents: newSecondaryAccents,
                                        });
                                    }}
                                    handleRemove={() => {
                                        const newSecondaryAccents = [...theme.colors.secondaryAccents];
                                        newSecondaryAccents.splice(index, 1);
                                        handleColorsChange({
                                            secondaryAccents: newSecondaryAccents,
                                        });
                                    }}
                                />
                            ))}

                            <Button
                                variant="solid"
                                onClick={() =>
                                    handleColorsChange({
                                        secondaryAccents: [...(theme.colors.secondaryAccents || []), '#000000'],
                                    })
                                }
                            >
                                Добавить цвет
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div
                style={{
                    marginTop: '1rem',
                }}
            >
                <h3 style={{ fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 600 }}>Текст</h3>
                <div
                    style={{
                        marginTop: '1rem',
                    }}
                >
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

            <div
                style={{
                    marginTop: '1rem',
                }}
            >
                <h3 style={{ fontSize: '1.125rem', lineHeight: '1.75rem', fontWeight: 600 }}>Фон</h3>
                <div
                    style={{
                        marginTop: '1rem',
                    }}
                >
                    <div>
                        <Label>Цвет фона карточки</Label>
                        <ColorPicker
                            value={theme.colors.slideBackground}
                            onChange={color => handleColorsChange({ slideBackground: color })}
                        />
                    </div>
                    <div>
                        <Label>Цвет фона страницы</Label>
                        <div style={{ display: 'flex', marginTop: '0.5rem', flexDirection: 'column', gap: '0.5rem' }}>
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
                                    variant="filled"
                                    value={theme.colors.pageBackground.imageUrl}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        handleColorsChange({
                                            pageBackground: {
                                                ...theme.colors.pageBackground,
                                                imageUrl: e.target.value,
                                            },
                                        })
                                    }
                                    placeholder="Адрес изображения"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
