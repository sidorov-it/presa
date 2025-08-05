/* eslint-disable no-nested-ternary */
'use client';

import React, { useState } from 'react';
import { HeaderFooterConfig, HeaderFooterItem } from '@/types';
import { Button } from '@/components/ui/Button';
import styles from './HeaderFooterConfigurator.module.css';
import { LuPlus } from 'react-icons/lu';
import { RiCloseFill } from 'react-icons/ri';
import { Switch } from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';
import { FiLoader } from 'react-icons/fi';
import { usePresentationStore } from '@/store/presentationStore';
import { useUIStateStore } from '@/store/uiStateStore';
import { useThemeStore } from '@/store/themeStore';
import Image from 'next/image';

interface HeaderFooterConfiguratorProps {
    header: HeaderFooterConfig;
    footer: HeaderFooterConfig;
    onHeaderChange: (config: HeaderFooterConfig) => void;
    onFooterChange: (config: HeaderFooterConfig) => void;
    showApplyTo?: boolean;
    applyTo?: 'all' | 'except-first' | 'except-first-last' | 'current-slide';
    onApplyToChange?: (value: 'all' | 'except-first' | 'except-first-last' | 'current-slide') => void;
    currentSlideIndex?: number;
    totalSlides?: number;
}

const HeaderFooterConfigurator: React.FC<HeaderFooterConfiguratorProps> = ({
    header,
    footer,
    onHeaderChange,
    onFooterChange,
    showApplyTo = false,
    applyTo = 'all',
    onApplyToChange,
    currentSlideIndex,
    totalSlides,
}) => {
    const [activeSection, setActiveSection] = useState<'header' | 'footer'>('header');
    // Новый state для загрузки по каждой позиции
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const updateSlide = usePresentationStore(state => state.updateSlide);

    const themeLogo = useThemeStore(state => state.currentTheme?.logo);
    // const themeLogoSize = useThemeStore(state => state.currentTheme.logoSize);

    const addItem = (section: 'header' | 'footer', position: 'left' | 'center' | 'right') => {
        const newItem: HeaderFooterItem = {
            type: 'text',
            content: '',
        };

        const currentConfig = section === 'header' ? header : footer;
        const updatedConfig = {
            ...currentConfig,
            [position]: newItem,
        };

        if (section === 'header') {
            onHeaderChange(updatedConfig);
        } else {
            onFooterChange(updatedConfig);
        }
    };

    const removeItem = (section: 'header' | 'footer', position: 'left' | 'center' | 'right') => {
        const currentConfig = section === 'header' ? header : footer;
        const updatedConfig = {
            ...currentConfig,
            [position]: { type: 'none' as const, content: '' },
        };

        if (section === 'header') {
            onHeaderChange(updatedConfig);
        } else {
            onFooterChange(updatedConfig);
        }
    };

    const updateItem = (
        section: 'header' | 'footer',
        position: 'left' | 'center' | 'right',
        item: HeaderFooterItem
    ) => {
        const currentConfig = section === 'header' ? header : footer;
        const updatedConfig = {
            ...currentConfig,
            [position]: item,
        };

        if (section === 'header') {
            onHeaderChange(updatedConfig);
        } else {
            onFooterChange(updatedConfig);
        }
    };

    const toggleFixedHeight = (section: 'header' | 'footer') => {
        const currentConfig = section === 'header' ? header : footer;
        const updatedConfig = {
            ...currentConfig,
            fixedHeight: !currentConfig.fixedHeight,
        };
        if (section === 'header') {
            onHeaderChange(updatedConfig);
        } else {
            onFooterChange(updatedConfig);
        }
    };

    const toggleSection = (section: 'header' | 'footer') => {
        const currentConfig = section === 'header' ? header : footer;
        const updatedConfig = {
            ...currentConfig,
            enabled: !currentConfig.enabled,
        };

        if (section === 'header') {
            onHeaderChange(updatedConfig);
        } else {
            onFooterChange(updatedConfig);
        }
    };

    // Обработчик загрузки вынесен наружу
    const handleFileChange = async (
        section: 'header' | 'footer',
        position: 'left' | 'center' | 'right',
        item: HeaderFooterItem,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const key = `${section}_${position}`;
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(prev => ({ ...prev, [key]: true }));
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/assets/upload', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error('Ошибка загрузки');
            const data = await res.json();
            const url = data.url || data.path || data.Location || data.result || '';
            updateItem(section, position, { ...item, content: url });
            if (section === 'header') {
                onHeaderChange({ ...header, [position]: { ...item, content: url } });
            } else {
                onFooterChange({ ...footer, [position]: { ...item, content: url } });
            }
            updateSlide(
                usePresentationStore.getState().currentPresentationId!,
                useUIStateStore.getState().selectedSlideId!,
                {
                    header: section === 'header' ? { ...header, [position]: { ...item, content: url } } : header,
                    footer: section === 'footer' ? { ...footer, [position]: { ...item, content: url } } : footer,
                }
            );
        } catch (err) {
            // TODO: show error
        } finally {
            setUploading(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleRemove = (
        section: 'header' | 'footer',
        position: 'left' | 'center' | 'right',
        item: HeaderFooterItem
    ) => {
        updateItem(section, position, { ...item, content: '' });
        if (section === 'header') {
            onHeaderChange({ ...header, [position]: { ...item, content: '' } });
        } else {
            onFooterChange({ ...footer, [position]: { ...item, content: '' } });
        }
        updateSlide(
            usePresentationStore.getState().currentPresentationId!,
            useUIStateStore.getState().selectedSlideId!,
            {
                header: section === 'header' ? { ...header, [position]: { ...item, content: '' } } : header,
                footer: section === 'footer' ? { ...footer, [position]: { ...item, content: '' } } : footer,
            }
        );
    };

    const LOGO_SIZE_OPTIONS = [
        { value: 'small', label: 'Маленький (5em)' },
        { value: 'medium', label: 'Средний (7.5em)' },
        { value: 'large', label: 'Большой (10em)' },
    ];

    // renderPosition теперь не содержит хуков
    const renderPosition = (section: 'header' | 'footer', position: 'left' | 'center' | 'right') => {
        const config = section === 'header' ? header : footer;
        const item = config[position];
        const key = `${section}_${position}`;
        const isUploading = uploading[key];

        if (item.type === 'none') {
            return (
                <div className={styles.emptyPosition}>
                    <Button
                        onClick={() => addItem(section, position)}
                        variant="outline"
                        size="sm"
                        className={styles.addButton}
                    >
                        <LuPlus />
                    </Button>
                </div>
            );
        }

        const logoImageSize = item.logoSize || 'medium';
        const sizeMap = {
            small: 50,
            medium: 75,
            large: 100,
        };

        const logoImageWidth = sizeMap[logoImageSize as keyof typeof sizeMap];
        const logoImageHeight = sizeMap[logoImageSize as keyof typeof sizeMap];

        return (
            <div className={styles.itemContainer}>
                <div className={styles.itemHeader}>
                    <select
                        value={item.type}
                        onChange={e =>
                            updateItem(section, position, { ...item, type: e.target.value as any, content: '' })
                        }
                        className={styles.typeSelect}
                    >
                        <option value="text">Текст</option>
                        <option value="logo">Логотип (загрузить)</option>
                        <option value="theme-logo">Логотип из темы</option>
                        <option value="slide-number">Номер слайда</option>
                    </select>
                    <Button
                        onClick={() => removeItem(section, position)}
                        variant="outline"
                        size="sm"
                        className={styles.removeButton}
                    >
                        <RiCloseFill />
                    </Button>
                </div>
                <div className={styles.itemContent}>
                    {item.type === 'text' && (
                        <input
                            type="text"
                            value={item.content}
                            onChange={e => updateItem(section, position, { ...item, content: e.target.value })}
                            placeholder="Введите текст"
                            className={styles.textInput}
                        />
                    )}
                    {item.type === 'logo' &&
                        (isUploading ? (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: 60,
                                }}
                            >
                                <FiLoader
                                    className={styles.uploadIcon}
                                    style={{ animation: 'spin 1s linear infinite' }}
                                />
                            </div>
                        ) : item.content ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <img
                                    src={item.content}
                                    alt="Загруженный логотип"
                                    style={{
                                        maxWidth: 80,
                                        maxHeight: 40,
                                        marginTop: 8,
                                        borderRadius: 4,
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                                    }}
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    style={{ marginTop: 8 }}
                                    onClick={() => handleRemove(section, position, item)}
                                >
                                    Заменить
                                </Button>
                            </div>
                        ) : (
                            <label className={styles.uploadLabel}>
                                <FiUpload className={styles.uploadIcon} />
                                <span>Загрузить логотип</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleFileChange(section, position, item, e)}
                                    className={styles.uploadInput}
                                />
                            </label>
                        ))}
                    {item.type === 'theme-logo' && themeLogo && (
                        <div className={styles.slideLogoContainer}>
                            <Image
                                src={themeLogo}
                                alt="Логотип из темы"
                                width={logoImageWidth}
                                height={logoImageHeight}
                            />
                        </div>
                    )}
                    {item.type === 'theme-logo' && !themeLogo && (
                         <div className={styles.slideNumberInfo}>В теме нет логотипа</div>
                    )}
                    {item.type === 'slide-number' && (
                        <div className={styles.slideNumberInfo}>Номер слайда будет отображаться автоматически</div>
                    )}
                    {(item.type === 'logo' || item.type === 'theme-logo') && (
                        <div style={{ marginTop: 8, marginBottom: 4 }}>
                            <label
                                htmlFor="logoSize"
                                style={{ fontSize: 13, color: 'var(--presentation-text-color)', marginRight: 8 }}
                            >
                                Размер логотипа:
                            </label>
                            <select
                                id="logoSize"
                                value={item.logoSize || 'medium'}
                                onChange={e =>
                                    updateItem(section, position, { ...item, logoSize: e.target.value as any })
                                }
                                style={{
                                    fontSize: 13,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    border: '1px solid #d1d5db',
                                }}
                            >
                                {LOGO_SIZE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.configurator}>
            {showApplyTo && onApplyToChange && (
                <div className={styles.applyToSection}>
                    <label className={styles.label}>Применить к:</label>
                    <select
                        value={applyTo}
                        onChange={e => onApplyToChange(e.target.value as any)}
                        className={styles.applyToSelect}
                    >
                        <option value="all">Все слайды</option>
                        <option value="except-first">Кроме первого</option>
                        <option value="except-first-last">Кроме первого и последнего</option>
                        {/* <option value="current-slide">Текущий слайд</option> */}
                    </select>
                </div>
            )}

            <div className={styles.sectionContent}>
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={header.enabled}
                                onChange={() => toggleSection('header')}
                                className={styles.checkbox}
                            />
                            Включить верхний колонтитул
                        </label>
                    </div>
                    {header.enabled && (
                        <>
                            <Switch.Root
                                checked={header.fixedHeight}
                                onCheckedChange={() => toggleFixedHeight('header')}
                            >
                                <Switch.HiddenInput />
                                <Switch.Control>
                                    <Switch.Thumb />
                                </Switch.Control>
                                <Switch.Label>Фиксированная высота</Switch.Label>
                            </Switch.Root>
                            <div className={styles.positionsGrid}>
                                <div className={styles.position}>
                                    <div className={styles.positionLabel}>Слева</div>
                                    {renderPosition('header', 'left')}
                                </div>
                                <div className={styles.position}>
                                    <div className={styles.positionLabel}>По центру</div>
                                    {renderPosition('header', 'center')}
                                </div>
                                <div className={styles.position}>
                                    <div className={styles.positionLabel}>Справа</div>
                                    {renderPosition('header', 'right')}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={footer.enabled}
                                onChange={() => toggleSection('footer')}
                                className={styles.checkbox}
                            />
                            Включить нижний колонтитул
                        </label>
                    </div>
                    {footer.enabled && (
                        <>
                            <Switch.Root
                                checked={footer.fixedHeight}
                                onCheckedChange={() => toggleFixedHeight('footer')}
                            >
                                <Switch.HiddenInput />
                                <Switch.Control>
                                    <Switch.Thumb />
                                </Switch.Control>
                                <Switch.Label>Фиксированная высота</Switch.Label>
                            </Switch.Root>

                            <div className={styles.positionsGrid}>
                                <div className={styles.position}>
                                    <div className={styles.positionLabel}>Слева</div>
                                    {renderPosition('footer', 'left')}
                                </div>
                                <div className={styles.position}>
                                    <div className={styles.positionLabel}>По центру</div>
                                    {renderPosition('footer', 'center')}
                                </div>
                                <div className={styles.position}>
                                    <div className={styles.positionLabel}>Справа</div>
                                    {renderPosition('footer', 'right')}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeaderFooterConfigurator;
