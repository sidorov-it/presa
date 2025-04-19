import { BiChevronDown } from 'react-icons/bi';
import { HEADING_LEVELS } from '@/consts';
import styles from './HeadingSelector.module.css';

export default function HeadingSelector({
    headingMenuRef,
    isHeadingMenuOpen,
    setIsHeadingMenuOpen,
    getCurrentHeadingLevel = () => 0,
    handleHeadingChange = () => {},
    headingLevels = HEADING_LEVELS,
}: {
    headingMenuRef?: React.RefObject<HTMLDivElement>;
    isHeadingMenuOpen: boolean;
    setIsHeadingMenuOpen: (isOpen: boolean) => void;
    getCurrentHeadingLevel: () => number;
    handleHeadingChange: (level: number) => void;
    headingLevels?: { level: number; label: string }[];
}) {
    const lightThemeStyle = {
        backgroundColor: 'white',
        color: '#333',
        borderColor: '#e0e0e0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    };

    const findHeading = (level: number) => {
        return headingLevels.find(item => item.level === level);
    };

    return (
        <div className={styles.headingSelector} ref={headingMenuRef}>
            <button
                className={`${styles.button} ${styles.headingButton}`}
                onClick={() => setIsHeadingMenuOpen(!isHeadingMenuOpen)}
                aria-label="Выбрать тип текста"
                aria-expanded={isHeadingMenuOpen}
            >
                <span className={styles.selectText}>{findHeading(getCurrentHeadingLevel())?.label}</span>
                <BiChevronDown size={14} className={styles.chevron} />
            </button>

            {isHeadingMenuOpen && (
                <div className={styles.headingDropdown} style={lightThemeStyle}>
                    {headingLevels.map(item => (
                        <button
                            key={item.level}
                            onClick={() => handleHeadingChange(item.level)}
                            className={`${styles.headingOption} ${getCurrentHeadingLevel() === item.level ? styles.activeHeading : ''}`}
                            style={{ color: '#333' }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
