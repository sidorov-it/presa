import { Label } from '@/components/ui/Label';
import ColorPicker from '@/components/ui/ColorPicker';
import { Theme, ThemeDesignShadow } from '@/types/theme';
import { ThemeDesign } from '@/types/theme';
import { FaRegImage } from 'react-icons/fa6';

import styles from './CardsDesign.module.css';
import BorderWidthSelector from '../BorderWidthSelector/BorderWidthSelector';
import ShadowSelector from '../ShadowSelector/ShadowSelector';

export default function CardsDesign({
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
            {/* Roundness */}
            <div>
                <Label>Скругление</Label>
                <div style={{ display: 'flex', marginTop: '0.5rem', gap: '0.5rem' }}>
                    {[4, 8, 12, 20].map(radius => (
                        <button
                            key={radius}
                            onClick={() =>
                                handleDesignChange({
                                    slide: {
                                        ...theme.design.slide,
                                        borderRadius: `${radius}px`,
                                    },
                                })
                            }
                            className={`${styles.radiusButton} ${
                                theme.design.slide.borderRadius === `${radius}px` ? styles.radiusActive : ''
                            }`}
                            aria-label={`Скругление ${radius}px`}
                        >
                            <div className={styles.radiusContent} style={{ borderRadius: `${radius}px` }} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Shadow */}
            <div>
                <Label>Тень</Label>
                <ShadowSelector
                    value={theme.design.slide.shadow}
                    onChange={value =>
                        handleDesignChange({
                            slide: { ...theme.design.slide, shadow: value as ThemeDesignShadow },
                        })
                    }
                />
            </div>

            {/* Border */}
            <div>
                <Label>Граница</Label>

                <div style={{ display: 'flex', marginTop: '0.5rem' }}>
                    <BorderWidthSelector
                        borderWidth={theme.design.slide.borderWidth}
                        onChange={value =>
                            handleDesignChange({
                                slide: { ...theme.design.slide, borderWidth: value },
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
                                            slide: {
                                                ...theme.design.slide,
                                                borderWidth: option.value as 'none' | 'thin' | 'medium' | 'thick',
                                            },
                                        })
                                    }
                                    className={`${styles.borderButton} ${theme.design.slide.borderWidth === option.value ? styles.borderActive : ''}`}
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
                <Label>Цвет границы</Label>

                <div style={{ display: 'flex', marginTop: '0.5rem' }}>
                    <ColorPicker
                        value={theme.design.slide.borderColor}
                        onChange={color =>
                            handleDesignChange({
                                slide: {
                                    ...theme.design.slide,
                                    borderColor: color,
                                },
                            })
                        }
                    />
                </div>
            </div>
            <div>
                <Label>Прозрачность</Label>
                <div style={{ display: 'flex', marginTop: '0.5rem', gap: '0.5rem' }}>
                    {[
                        { value: 1, preview: 'bg-white' },
                        { value: 0.8, preview: 'bg-opacity-80' },
                        { value: 0.5, preview: 'bg-opacity-50' },
                    ].map(option => (
                        <button
                            key={option.value}
                            onClick={() =>
                                handleDesignChange({
                                    slide: {
                                        ...theme.design.slide,
                                        opacity: option.value,
                                    },
                                })
                            }
                            className={`${styles.opacityButton} ${
                                theme.design.slide.opacity === option.value ? styles.opacityActive : ''
                            }`}
                            aria-label={`Прозрачность ${option.value * 100}%`}
                        >
                            <div className={styles.opacityContent} style={{ opacity: option.value }} />
                            <FaRegImage className={styles.opacityContentImage} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Image Shape */}
            <div>
                <Label>Форма изображения</Label>
                <div style={{ display: 'flex', marginTop: '0.5rem', gap: '0.5rem' }}>
                    {['default', 'fade', 'diagonal', 'round', 'round-inverse', 'wiggle'].map(option => (
                        <button
                            key={option}
                            onClick={() =>
                                handleDesignChange({
                                    slide: {
                                        ...theme.design.slide,
                                        imageShape: option as
                                            | 'default'
                                            | 'fade'
                                            | 'diagonal'
                                            | 'round'
                                            | 'round-inverse'
                                            | 'wiggle',
                                    },
                                })
                            }
                            className={`${styles.imageShapeButton} ${
                                theme.design.slide.imageShape === option ? styles.imageShapeActive : ''
                            }`}
                            aria-label={`Форма изображения ${option}`}
                        >
                            <div className={styles.imageShapeLeft} />
                            <div className={`${styles.imageShapeRight} ${styles[`imageShape-${option}`]}`}>
                                <FaRegImage className={styles.imageShapeContentImage} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
