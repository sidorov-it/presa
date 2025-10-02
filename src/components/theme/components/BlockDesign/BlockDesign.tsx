import { Label } from '@/components/ui/Label';
import { Theme } from '@/types/theme';
import { ThemeDesign } from '@/types/theme';
import { ButtonGroup, RadioGroup, Stack } from '@chakra-ui/react';
import styles from './BlockDesign.module.css';
import ColorPicker from '@/components/ui/ColorPicker';
import { Button } from '@/components/ui/Button';
import Tooltip from '@/components/tooltip/Tooltip';
import BorderWidthSelector from '../BorderWidthSelector/BorderWidthSelector';
import ShadowSelector from '../ShadowSelector/ShadowSelector';
import { BsCircle, BsCircleFill, BsCircleHalf } from 'react-icons/bs';

const blockFillColorsTypes = [
    {
        value: 'subtle',
        label: 'Мягкий',
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
    handleDesignChange: (design: Partial<ThemeDesign> | ((currentTheme: Theme) => Partial<ThemeDesign>)) => void;
}) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            }}
        >
            <div>
                <Label>Цвет блока</Label>
                <div style={{ display: 'flex', marginTop: '0.5rem', flexDirection: 'column', gap: '0.5rem' }}>
                    <RadioGroup.Root
                        value={theme.design.blocks.blockFillColorsType}
                        variant={'subtle'}
                        onValueChange={e =>
                            handleDesignChange({
                                blocks: {
                                    ...theme.design.blocks,
                                    blockFillColorsType: e.value as 'subtle' | 'primary' | 'custom',
                                },
                            })
                        }
                    >
                        <Stack
                            gap={2}
                            style={
                                {
                                    '--presentation-accent-blocks-color': theme.colors.primaryAccent,
                                    '--presentation-accent-blocks-color-subtle':
                                        theme.colors.pageBackground.color || theme.colors.primaryAccent,
                                } as React.CSSProperties
                            }
                        >
                            {blockFillColorsTypes.map(item => (
                                <RadioGroup.Item key={item.value} value={item.value} className={styles.radioItem}>
                                    <RadioGroup.ItemHiddenInput />
                                    <RadioGroup.ItemIndicator />
                                    <RadioGroup.ItemText>
                                        <div className={styles.radioItemTextContainer}>
                                            <span
                                                className={`${styles.radioItemText} ${styles[`radioItemText-${item.value}`]}`}
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
                            {/* <Span>Совет: вы можете добавить несколько цветов для создания эффекта чередования.</Span> */}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {(theme.design.blocks.blockBackgroundCustomColors || ['#000000']).map(
                                    (color, index) => (
                                        <ColorPicker
                                            key={index}
                                            value={color}
                                            isShowRemoveIcon={true}
                                            onChange={newColor => {
                                                handleDesignChange((currentTheme: Theme) => ({
                                                    blocks: {
                                                        ...currentTheme.design.blocks,
                                                        blockBackgroundCustomColors:
                                                            currentTheme.design.blocks.blockBackgroundCustomColors.map(
                                                                (color, i) => (i === index ? newColor : color)
                                                            ),
                                                    },
                                                }));
                                            }}
                                            handleRemove={() => {
                                                handleDesignChange((currentTheme: Theme) => ({
                                                    blocks: {
                                                        ...currentTheme.design.blocks,
                                                        blockBackgroundCustomColors:
                                                            currentTheme.design.blocks.blockBackgroundCustomColors.filter(
                                                                (_, i) => i !== index
                                                            ),
                                                    },
                                                }));
                                            }}
                                        />
                                    )
                                )}

                                <Button
                                    variant="solid"
                                    disabled={theme.design.blocks.blockBackgroundCustomColors?.length >= 5}
                                    onClick={() => {
                                        handleDesignChange((currentTheme: Theme) => ({
                                            blocks: {
                                                ...currentTheme.design.blocks,
                                                blockBackgroundCustomColors: [
                                                    ...currentTheme.design.blocks.blockBackgroundCustomColors,
                                                    '#000000',
                                                ],
                                            },
                                        }));
                                    }}
                                >
                                    Добавить цвет
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <Label>Прозрачность фона блока</Label>

                <div style={{ display: 'flex', marginTop: '0.5rem' }}>
                    <ButtonGroup size="sm" variant="outline" className={styles.opacityButtonGroup}>
                        {[
                            { value: 'fill', label: 'Заполненная' },
                            { value: 'semi', label: 'Полупрозрачная' },
                            { value: 'none', label: 'Прозрачная' },
                        ].map(option => (
                            <Tooltip
                                key={option.value}
                                content={<div>{option.label}</div>}
                                showArrow={true}
                                openDelay={500}
                                closeDelay={100}
                            >
                                <Button
                                    key={option.value}
                                    onClick={() =>
                                        handleDesignChange({
                                            blocks: {
                                                ...theme.design.blocks,
                                                backgroundBlockFillType: option.value as 'fill' | 'semi' | 'none',
                                            },
                                        })
                                    }
                                    className={`${styles.opacityButton} ${theme.design.blocks.backgroundBlockFillType === option.value ? styles.opacityActive : ''}`}
                                    aria-label={`Граница ${option.label}`}
                                >
                                    <p className={styles.opacityContent}>
                                        {option.value === 'fill' && <BsCircleFill />}
                                        {option.value === 'semi' && <BsCircleHalf />}
                                        {option.value === 'none' && <BsCircle />}
                                    </p>
                                </Button>
                            </Tooltip>
                        ))}
                    </ButtonGroup>
                </div>
            </div>

            <div>
                <Label>Граница</Label>

                <div style={{ display: 'flex', marginTop: '0.5rem' }}>
                    <BorderWidthSelector
                        borderWidth={theme.design.blocks.borderWidth}
                        onChange={value =>
                            handleDesignChange({
                                blocks: { ...theme.design.blocks, borderWidth: value },
                            })
                        }
                    />

                    {/* <ButtonGroup size="sm" variant="outline" className={styles.borderButtonGroup}>
                        {[
                            { value: 'none', label: 'Нет' },
                            { value: 'thin', label: 'Тонкая' },
                            { value: 'medium', label: 'Средняя' },
                            { value: 'thick', label: 'Толстая' },
                        ].map(option => (
                            <Tooltip
                                key={option.value}
                                content={<div>{option.label}</div>}
                                showArrow={true}
                                openDelay={500}
                                closeDelay={100}
                            >
                                <Button
                                    key={option.value}
                                    onClick={() =>
                                        handleDesignChange({
                                            blocks: {
                                                ...theme.design.blocks,
                                                borderWidth: option.value as ThemeDesignBorderWidth,
                                            },
                                        })
                                    }
                                    className={`${styles.borderButton} ${theme.design.blocks.borderWidth === option.value ? styles.borderActive : ''}`}
                                    aria-label={`Граница ${option.label}`}
                                >
                                    <p className={styles.borderContent}>
                                        {option.value === 'none' && <RxBorderNone />}
                                        {option.value !== 'none' && (
                                            <div
                                                className={`${styles.borderBorder} ${styles[`border-${option.value}`]}`}
                                            />
                                        )}
                                    </p>
                                </Button>
                            </Tooltip>
                        ))}
                    </ButtonGroup> */}
                </div>
            </div>

            <div>
                <Label>Тень</Label>
                <ShadowSelector
                    value={theme.design.blocks.shadow}
                    onChange={value => handleDesignChange({ blocks: { ...theme.design.blocks, shadow: value } })}
                />
            </div>
        </div>
    );
}
