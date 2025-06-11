import { ColorPicker } from '../../ui/ColorPicker/ColorPicker';
// import { InfoIcon } from '../../ui/InfoIcon';
import { Label } from '../../ui/Label';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input/Input';

import { Theme, ThemeDesign } from '@/types/theme';
import { ThemeColors } from '@/types/theme';
import { Button } from '../../ui/Button';
import styles from '../ThemeEditor.module.css';

export default function Colors({
    theme,
    handleColorsChange,
    handleDesignChange,
}: {
    theme: Theme;
    handleColorsChange: (colors: Partial<ThemeColors>) => void;
    handleDesignChange: (design: Partial<ThemeDesign>) => void;
}) {
    return (
        <div style={{ width: '100%' }}>
            <div>
                <h3 className={styles.sectionTitle}>Colors</h3>
                <h4 className={styles.sectionSubtitle}>
                    Палитра
                    {/* <InfoIcon tooltip="Эти цвета появляются в палитре цветов при использовании этой темы. Основной акцентный цвет используется по умолчанию для ссылок, кнопок и других элементов." /> */}
                </h4>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <Label>Основной акцентный цвет</Label>
                        <ColorPicker
                            value={theme.colors?.primaryAccent}
                            onChange={color => handleColorsChange({ primaryAccent: color })}
                        />
                    </div>
                    <div>
                        <Label>Дополнительные цвета (необязательно)</Label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
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
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    handleColorsChange({
                                        secondaryAccents: [...(theme.colors.secondaryAccents || []), '#000000'],
                                    })
                                }
                                style={{
                                    marginTop: '8px',
                                    alignSelf: 'flex-start',
                                    fontSize: '14px',
                                    padding: '8px 16px',
                                }}
                            >
                                Добавить цвет
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h4 className={styles.sectionSubtitle}>Текст</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            <div>
                <h4 className={styles.sectionSubtitle}>Фон</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <Label>Цвет слайда</Label>
                        <ColorPicker
                            value={theme.colors.slideBackground}
                            onChange={color => handleColorsChange({ slideBackground: color })}
                        />
                    </div>
                    <div>
                        <Label>Цвет фона страницы</Label>
                        <div style={{ display: 'flex', marginTop: '8px', flexDirection: 'column', gap: '8px' }}>
                            <Select
                                options={[
                                    { value: 'color', label: 'Solid color' },
                                    { value: 'image', label: 'Image' },
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
