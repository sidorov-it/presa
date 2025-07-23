'use client';

import React from 'react';
import { HeaderFooterConfig, HeaderFooterPosition } from '@/types';
import styles from './HeaderFooter.module.css';

interface HeaderFooterProps {
    config: HeaderFooterConfig;
    type: 'header' | 'footer';
    currentSlideIndex: number;
    totalSlides: number;
    className?: string;
    theme?: { logo?: string };
}

const HeaderFooter: React.FC<HeaderFooterProps> = ({
    config,
    type,
    currentSlideIndex,
    totalSlides,
    className,
    theme,
}) => {
    if (!config.enabled) {
        return null;
    }

    const getLogoMaxWidth = (logoSize?: 'small' | 'medium' | 'large') => {
        switch (logoSize) {
            case 'small':
                return '5em';
            case 'large':
                return '10em';
            case 'medium':
            default:
                return '7.5em';
        }
    };

    const renderPosition = (position: HeaderFooterPosition, alignment: 'left' | 'center' | 'right') => {
        if (position.type === 'none') {
            return null;
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
                            style={{ maxWidth: getLogoMaxWidth(position.logoSize) }}
                            onError={e => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    );
                }
                break;
            case 'theme-logo':
                if (theme?.logo) {
                    content = (
                        <img
                            src={theme.logo}
                            alt="Theme Logo"
                            className={styles.logo}
                            style={{ maxWidth: getLogoMaxWidth(position.logoSize) }}
                            onError={e => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    );
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
