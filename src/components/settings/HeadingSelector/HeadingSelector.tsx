import styles from './HeadingSelector.module.css'
import { BiChevronDown } from "react-icons/bi"

const defaultHeadingLevels = [
    { label: "Текст", level: 0 },
    { label: "Заголовок 1", level: 1 },
    { label: "Заголовок 2", level: 2 },
    { label: "Заголовок 3", level: 3 },
    { label: "Заголовок 4", level: 4 },
    { label: "Заголовок 5", level: 5 },
    { label: "Дисплей", level: 6 },
    { label: "Монстр", level: 7 },
];

export default function HeadingSelector({
    headingMenuRef,
    isHeadingMenuOpen,
    setIsHeadingMenuOpen,
    getCurrentHeadingLevel = () => 0,
    handleHeadingChange = () => { },
    headingLevels = defaultHeadingLevels,
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
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        };
    
    return (
        <div className={styles.headingSelector} ref={headingMenuRef}>
            <button
                className={`${styles.button} ${styles.headingButton}`}
                onClick={() => setIsHeadingMenuOpen(!isHeadingMenuOpen)}
                aria-label="Выбрать тип текста"
                aria-expanded={isHeadingMenuOpen}
            >
                <span className={styles.selectText}>{headingLevels[getCurrentHeadingLevel()].label}</span>
                <BiChevronDown size={14} className={styles.chevron} />
            </button>

            {isHeadingMenuOpen && (
                <div className={styles.headingDropdown} style={lightThemeStyle}>
                    {headingLevels.map((item) => (
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
    )
}