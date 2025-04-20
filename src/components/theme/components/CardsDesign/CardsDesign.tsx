import { Label } from '@/components/ui/Label';
import { ButtonGroup } from '@chakra-ui/react';
import { Button } from '@/components/ui/Button';
import ColorPicker from '@/components/ui/ColorPicker';
import { Theme } from '@/types/theme';
import { ThemeDesign } from '@/types/theme';
import Tooltip from '@/components/tooltip/Tooltip';
import { RxBorderNone } from 'react-icons/rx';
import { FaRegImage } from 'react-icons/fa6';

import styles from './CardsDesign.module.css';

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
                <div style={{ display: 'flex', marginTop: '0.5rem', gap: '0.5rem' }}>
                    {[
                        { value: 'none', shadow: 'none' },
                        { value: 'sm', shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
                        { value: 'md', shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
                    ].map(option => (
                        <button
                            key={option.value}
                            onClick={() =>
                                handleDesignChange({
                                    slide: {
                                        ...theme.design.slide,
                                        shadow: option.value,
                                    },
                                })
                            }
                            className={`${styles.shadowButton} ${
                                theme.design.slide.shadow === option.value ? styles.shadowActive : ''
                            }`}
                            aria-label={`Тень ${option.value}`}
                        >
                            <div className={`${styles.shadowContent} ${styles[`shadow-${option.value}`]}`} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Border */}
            <div>
                <Label>Граница</Label>

                <div style={{ display: 'flex', marginTop: '0.5rem' }}>
                    <ButtonGroup size="sm" variant="outline" className={styles.borderButtonGroup}>
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
                                                border: option.value,
                                            },
                                        })
                                    }
                                    className={`${styles.borderButton} ${theme.design.slide.border === option.value ? styles.borderActive : ''}`}
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
                    </ButtonGroup>
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
                                    blocks: {
                                        ...theme.design.blocks,
                                        opacity: option.value,
                                    },
                                })
                            }
                            className={`${styles.opacityButton} ${
                                theme.design.blocks.opacity === option.value ? styles.opacityActive : ''
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
