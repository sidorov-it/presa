'use client';

import React from 'react';
import { HeaderFooterConfig } from '@/types';
// import { Checkbox } from '@/components/ui/Checkbox';
import HeaderFooterPositionSettings from './HeaderFooterPositionSettings';
import styles from './HeaderFooterSettings.module.css';
import { Checkbox } from '@chakra-ui/react';

interface HeaderFooterSettingsProps {
    header: HeaderFooterConfig;
    footer: HeaderFooterConfig;
    onHeaderChange: (header: HeaderFooterConfig) => void;
    onFooterChange: (footer: HeaderFooterConfig) => void;
    currentSlideIndex: number;
    totalSlides: number;
}

const defaultPosition = { type: 'none' as const, content: '' };

const defaultHeaderFooter: HeaderFooterConfig = {
    enabled: false,
    left: defaultPosition,
    center: defaultPosition,
    right: defaultPosition,
};

const HeaderFooterSettings: React.FC<HeaderFooterSettingsProps> = ({
    header = defaultHeaderFooter,
    footer = defaultHeaderFooter,
    onHeaderChange,
    onFooterChange,
    currentSlideIndex,
    totalSlides,
}) => {
    const handleHeaderEnabledChange = () => {
        onHeaderChange({
            ...header,
            enabled: !header.enabled,
        });
    };

    const handleFooterEnabledChange = () => {
        onFooterChange({
            ...footer,
            enabled: !footer.enabled,
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Checkbox.Root
                        checked={header.enabled}
                        onCheckedChange={handleHeaderEnabledChange}
                    >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label>Заголовок слайда</Checkbox.Label>
                    </Checkbox.Root>
                    {/* <Checkbox
                        id="header-enabled"
                        checked={header.enabled}
                        onChange={handleHeaderEnabledChange}
                    >
                        Заголовок слайда
                    </Checkbox> */}
                </div>
                {header.enabled && (
                    <HeaderFooterPositionSettings
                        config={header}
                        onChange={onHeaderChange}
                        currentSlideIndex={currentSlideIndex}
                        totalSlides={totalSlides}
                    />
                )}
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                <Checkbox.Root
                        checked={footer.enabled}
                        onCheckedChange={handleFooterEnabledChange}
                    >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label>Подвал слайда</Checkbox.Label>
                    </Checkbox.Root>
                    {/* <Checkbox
                        id="footer-enabled"
                        checked={footer.enabled}
                        onChange={handleFooterEnabledChange}
                    >
                        Подвал слайда
                    </Checkbox> */}
                </div>
                {footer.enabled && (
                    <HeaderFooterPositionSettings
                        config={footer}
                        onChange={onFooterChange}
                        currentSlideIndex={currentSlideIndex}
                        totalSlides={totalSlides}
                    />
                )}
            </div>
        </div>
    );
};

export default HeaderFooterSettings; 