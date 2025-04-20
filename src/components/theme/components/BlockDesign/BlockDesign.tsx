import { Label } from '@/components/ui/Label';
import { Theme } from '@/types/theme';
import { ThemeDesign } from '@/types/theme';
import { RadioGroup, Span, Stack } from '@chakra-ui/react';
import styles from './BlockDesign.module.css';
import ColorPicker from '@/components/ui/ColorPicker';
import { Button } from '@/components/ui/Button';
const blockFillColorsTypes = [
    {
        value: 'subtle',
        label: 'Фон слайда',
    },
    {
        value: 'primary',
        label: 'Акцентный цвет',
    },
    {
        value: 'custom',
        label: 'Свой цвет',
    },
];

export default function BlockDesign({
    theme,
    handleDesignChange,
}: {
    theme: Theme;
    handleDesignChange: (design: Partial<ThemeDesign>) => void;
}) {
    return (
        <div
            style={{
                marginTop: '1rem',
            }}
        >
            <div>
                <Label>Свет блока</Label>
                <div style={{ display: 'flex', marginTop: '0.5rem', flexDirection: 'column', gap: '0.5rem' }}>
                    <RadioGroup.Root
                        value={theme.design.blocks.blockFillColorsType}
                        variant={'subtle'}
                        onValueChange={e =>
                            handleDesignChange({
                                blocks: {
                                    ...theme.design.blocks,
                                    blockFillColorsType: e.value as 'subtle' | 'primary' | 'custom',
                                    // backgroundColor: e.value,
                                },
                            })
                        }
                    >
                        <Stack gap={2}>
                            {blockFillColorsTypes.map(item => (
                                <RadioGroup.Item key={item.value} value={item.value}>
                                    <RadioGroup.ItemHiddenInput />
                                    <RadioGroup.ItemIndicator />
                                    <RadioGroup.ItemText>
                                        <div className={styles.radioItemContainer}>
                                            <span
                                                className={`${styles.radioItem} ${styles[`radioItem-${item.value}`]}`}
                                            ></span>
                                            {item.label}
                                        </div>
                                    </RadioGroup.ItemText>
                                </RadioGroup.Item>
                            ))}
                        </Stack>
                    </RadioGroup.Root>

                    {theme.design.blocks.blockFillColorsType === 'custom' && (
                        <div className={styles.customColorContainer}>
                            <Span>Совет: вы можете добавить несколько цветов для создания эффекта чередования.</Span>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {(theme.design.blocks.blockBackgroundCustomColors || ['#000000']).map(
                                    (color, index) => (
                                        <ColorPicker
                                            key={index}
                                            value={color}
                                            isShowRemoveIcon={true}
                                            onChange={newColor => {
                                                const newCustomColors = [
                                                    ...theme.design.blocks.blockBackgroundCustomColors,
                                                ];
                                                newCustomColors[index] = newColor;
                                                handleDesignChange({
                                                    blocks: {
                                                        ...theme.design.blocks,
                                                        blockBackgroundCustomColors: newCustomColors,
                                                    },
                                                });
                                            }}
                                            handleRemove={() => {
                                                const newCustomColors = [
                                                    ...theme.design.blocks.blockBackgroundCustomColors,
                                                ];
                                                newCustomColors.splice(index, 1);
                                                handleDesignChange({
                                                    blocks: {
                                                        ...theme.design.blocks,
                                                        blockBackgroundCustomColors: newCustomColors,
                                                    },
                                                });
                                            }}
                                        />
                                    )
                                )}

                                <Button
                                    variant="solid"
                                    onClick={() =>
                                        handleDesignChange({
                                            blocks: {
                                                ...theme.design.blocks,
                                                blockBackgroundCustomColors: [
                                                    ...(theme.design.blocks.blockBackgroundCustomColors || []),
                                                    '#000000',
                                                ],
                                            },
                                        })
                                    }
                                >
                                    Добавить цвет
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
