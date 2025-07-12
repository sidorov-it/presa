'use client';

import React from 'react';
import styles from './IconToggle.module.css';
import Tooltip from '@/components/tooltip/Tooltip';

interface IconToggleProps {
    icon: React.ReactNode;
    isEnabled: boolean;
    onToggle: () => void;
    ariaLabel: string;
}

const IconToggle: React.FC<IconToggleProps> = ({ icon, isEnabled, onToggle, ariaLabel }) => {
    return (
        <Tooltip content={ariaLabel}>
            <button
                className={`${styles.toggle} ${isEnabled ? styles.enabled : ''}`}
                onClick={onToggle}
                aria-label={ariaLabel}
                role="switch"
                aria-checked={isEnabled}
            >
                {icon}
            </button>
        </Tooltip>
    );
};

export default IconToggle;
