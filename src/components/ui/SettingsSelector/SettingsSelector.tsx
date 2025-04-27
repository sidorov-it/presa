'use client';
import React, { useState, useRef, useEffect } from 'react';
import { BsChevronDown } from 'react-icons/bs';
import { IconType } from 'react-icons/lib';
import styles from './SettingsSelector.module.css';

interface SettingsSelectorProps {
    options: { id: string; label: string; Icon?: IconType }[];
    value: string;
    setValue: (value: string) => void;
}

const SettingsSelector: React.FC<SettingsSelectorProps> = ({ value, setValue, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentOption = options.find(option => option.id === value) || options[0];
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: (typeof options)[number]) => {
        setValue(option.id);
        setIsOpen(false);
    };

    return (
        <div className={styles.shapeSelect} ref={dropdownRef}>
            <button
                className={styles.shapeButton}
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                {currentOption.Icon && (
                    <span className={styles.shapeIcon}>
                        <currentOption.Icon size={18} />
                    </span>
                )}
                <span className={styles.shapeLabel}>{currentOption.label}</span>
                <BsChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
            </button>

            {isOpen && (
                <div className={styles.shapeDropdown}>
                    {options.map(option => (
                        <button
                            key={option.id}
                            className={`${styles.shapeOption} ${value === option.id ? styles.selected : ''}`}
                            onClick={() => handleSelect(option)}
                            aria-label={`Select ${option.label} shape`}
                        >
                            {option.Icon && (
                                <span className={styles.shapeIcon}>
                                    <option.Icon size={18} />
                                </span>
                            )}
                            <span className={styles.shapeLabel}>{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SettingsSelector;
