'use client';

import React from 'react';
import { HeaderFooterConfig, HeaderFooterLogoSize, HeaderFooterPosition } from '@/types';
import { Theme } from '@/types/theme';
import styles from './HeaderFooter.module.css';

interface HeaderFooterProps {
    config: HeaderFooterConfig;
    type: 'header' | 'footer';
    currentSlideIndex: number;
    totalSlides: number;
    className?: string;
    theme: Theme;
}

const HeaderFooter: React.FC<HeaderFooterProps> = ({
    config,
    type,
    currentSlideIndex,
    totalSlides,
    className,
    theme,
}) => {
    const themeLogo = theme.logo;
    if (!config.enabled) {
        return null;
    }

    const getLogoDimension = (logoSize?: HeaderFooterLogoSize) => {
        const size = logoSize || 'M';
        const dimensionBySize: Record<HeaderFooterLogoSize, string> = {
            // S: 'calc(1.53884em / var(--media-scale))',
            S: '1.53884em',
            // M: 'calc(1.9856em / var(--media-scale))',
            M: '1.9856em',
            // L: 'calc(2.63092em / var(--media-scale))',
            L: '2.63092em',
            // XL: 'calc(3.4748em / var(--media-scale))',
            XL: '3.4748em',
        };
        return dimensionBySize[size];
    };

    const renderPosition = (position: HeaderFooterPosition, alignment: 'left' | 'center' | 'right') => {
        if (position.type === 'none') {
            return <div className={`${styles.position} ${styles[alignment]}`} />;
        }

        let content: React.ReactNode = null;

        switch (position.type) {
            case 'text':
                content = <span className={styles.text}>{position.content}</span>;
                break;
            case 'logo':
                if (position.content) {
                    content = (
                        <img
                            src={position.content}
                            alt="Logo"
                            className={styles.logo}
                            style={{
                                maxWidth: getLogoDimension(position.logoSize),
                                maxHeight: getLogoDimension(position.logoSize),
                            }}
                            onError={e => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    );
                }
                break;
            case 'theme-logo':
                if (themeLogo) {
                    content = (
                        <img
                            src={themeLogo}
                            alt="Theme Logo"
                            className={styles.logo}
                            style={{
                                maxWidth: getLogoDimension(position.logoSize),
                                maxHeight: getLogoDimension(position.logoSize),
                            }}
                            onError={e => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    );
                } else {
                    content = <div className={styles.logo} />;
                }
                break;
            case 'slide-number':
                content = (
                    <span className={styles.slideNumber}>
                        {currentSlideIndex + 1} / {totalSlides}
                    </span>
                );
                break;
        }

        if (!content) {
            return null;
        }

        return <div className={`${styles.position} ${styles[alignment]}`}>{content}</div>;
    };

    const containerClass = `${styles.absoluteHeaderFooter} ${styles[type]}`;

    return (
        <div className={`${styles.container} ${containerClass} ${className || ''}`}>
            <div className={styles.content}>
                {renderPosition(config.left, 'left')}
                {renderPosition(config.center, 'center')}
                {renderPosition(config.right, 'right')}
            </div>
        </div>
    );
};

export default HeaderFooter;
