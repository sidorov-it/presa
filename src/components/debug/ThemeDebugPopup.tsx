import React, { useEffect, useState } from 'react';
import styles from './ThemeDebugPopup.module.css';

interface CSSVariable {
    name: string;
    value: string;
}

interface ThemeDebugPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const appliedVars = [
    '--presentation-slide-background',
    '--presentation-slide-border-color',
    '--presentation-slide-border-radius',
    '--presentation-slide-border-width',
    '--presentation-slide-shadow',
    '--presentation-heading-line-height',
    '--presentation-heading-weight',
    '--presentation-heading-capitalization',
    '--presentation-heading-color',
    '--presentation-heading-font',
    '--presentation-heading-letter-spacing',
    '--presentation-body-capitalization',
    '--presentation-body-font',
    '--presentation-body-letter-spacing',
    '--presentation-body-line-height',
    '--presentation-body-weight',
    '--presentation-text-color',
    '--presentation-button-text-color',
    '--presentation-button-color',
    '--presentation-button-radius',
    '--presentation-button-hover-color',
    '--presentation-page-background-color',
    '--presentation-link-color',
    '--presentation-slide-image-mask-image-top',
    '--presentation-slide-image-mask-image-left',
    '--presentation-slide-image-mask-image-right',
    '--presentation-page-background-image',
];

const ThemeDebugPopup: React.FC<ThemeDebugPopupProps> = ({ isOpen, onClose }) => {
    const [cssVariables, setCssVariables] = useState<CSSVariable[]>([]);

    useEffect(() => {
        if (isOpen) {
            const variables: CSSVariable[] = [];

            const elem = document.documentElement;
            // Chrome
            const styles = elem.computedStyleMap();
            Array.from(styles).forEach(([prop, val]) => {
                if (prop.startsWith('--presentation-')) {
                    // variables[prop] = val.toString();
                    variables.push({
                        name: prop,
                        value: val.toString(),
                    });
                }
            });

            const computedStyle = getComputedStyle(document.documentElement);

            // Get all CSS variables that start with --presentation or are theme related
            for (let i = 0; i < computedStyle.length; i++) {
                const prop = computedStyle[i];
                if (prop.startsWith('--presentation-')) {
                    variables.push({
                        name: prop,
                        value: computedStyle.getPropertyValue(prop).trim(),
                    });
                }
            }

            setCssVariables(variables);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles.popup}>
            <div className={styles.header}>
                <h3 className={styles.title}>Theme Variables Debug</h3>
                <button onClick={onClose} className={styles.closeButton} aria-label="Close debug popup">
                    <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className={styles.content}>
                <div className={styles.variablesList}>
                    {cssVariables.map(variable => (
                        <div key={variable.name} className={styles.variableItem}>
                            <div className={styles.variableInfo}>
                                {appliedVars.includes(variable.name) ? <p className={styles.appliedVar}>✅</p> : null}
                                <p className={styles.variableName}>{variable.name}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <p className={styles.variableValue}>{variable.value}</p>
                                {variable.value.includes('#') || variable.value.includes('rgb') ? (
                                    <div
                                        className={styles.colorPreview}
                                        style={{ backgroundColor: variable.value }}
                                        title={variable.value}
                                    />
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ThemeDebugPopup;
