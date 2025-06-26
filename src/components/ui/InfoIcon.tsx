import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import styles from './InfoIcon.module.css';

interface InfoIconProps {
    tooltip: string;
    className?: string;
}

export const InfoIcon = ({ tooltip, className }: InfoIconProps) => {
    return (
        <Tippy content={tooltip} theme="light" placement="top" arrow={true} maxWidth={300} className={styles.tooltip}>
            <button type="button" className={`${styles.button}${className ? ` ${className}` : ''}`} aria-label="Информация" tabIndex={0}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.icon}
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
            </button>
        </Tippy>
    );
};
