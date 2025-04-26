import { BiChevronDown } from 'react-icons/bi';
import { HEADING_LEVELS } from '@/consts';
import styles from './SmartLayoutSelector.module.css';

const LAYOUT_TYPES = [
    {
        id: 'images-with-text',
        label: 'Images with Text',
    },
    {
        id: 'bullets',
        label: 'Bullets',
    },
    {
        id: 'numbers',
        label: 'Numbers',
    },
    {
        id: 'grid',
        label: 'Grid',
    },
    {
        id: 'timeline',
        label: 'Timeline',
    },
];

const findLayoutType = (layoutType: string) => {
    return LAYOUT_TYPES.find(item => item.id === layoutType);
};

export default function SmartLayoutSelector({
    smartLayoutMenuRef,
    layoutType,
    setLayoutType,
    isSmartLayoutMenuOpen,
    setIsSmartLayoutMenuOpen,
    // headingMenuRef,
    // isHeadingMenuOpen,
    // setIsHeadingMenuOpen,
}: {
    smartLayoutMenuRef?: React.RefObject<HTMLDivElement>;
    layoutType: string;
    isSmartLayoutMenuOpen: boolean;
    setLayoutType: (layoutType: string) => void;
    setIsSmartLayoutMenuOpen: (isOpen: boolean) => void;
    // headingMenuRef?: React.RefObject<HTMLDivElement>;
    // isHeadingMenuOpen: boolean;
    // setIsHeadingMenuOpen: (isOpen: boolean) => void;
    // getCurrentHeadingLevel: () => number;
    // handleHeadingChange: (level: number) => void;
    // headingLevels?: { level: number; label: string }[];
}) {
    return (
        <div className={styles.headingSelector} ref={smartLayoutMenuRef}>
            <button
                className={`${styles.button} ${styles.headingButton}`}
                onClick={() => setIsSmartLayoutMenuOpen(!isSmartLayoutMenuOpen)}
                aria-label="Выбрать тип"
                aria-expanded={isSmartLayoutMenuOpen}
            >
                <span className={styles.selectText}>{findLayoutType(layoutType)?.label}</span>
                <BiChevronDown size={14} className={styles.chevron} />
            </button>

            {isSmartLayoutMenuOpen && (
                <div className={styles.headingDropdown}>
                    {LAYOUT_TYPES.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setLayoutType(item.id)}
                            className={`${styles.headingOption} ${layoutType === item.id ? styles.activeHeading : ''}`}
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
