import {
    TwoColumnsIcon,
    TwoColumnsLeftIcon,
    TwoColumnsRightIcon,
    ThreeColumnsIcon,
    FourColumnsIcon,
} from '@/components/icons';
import styles from './LayoutTemplateDropdown.module.css';
import { LayoutType, Layout } from '@/types';
import { useState } from 'react';

const getLayoutTypeName = (columns: number): string => {
    switch (columns) {
        case 1:
            return '1 столбец';
        case 2:
            return '2 столбца';
        case 3:
            return '3 столбца';
        case 4:
            return '4 столбца';
        default:
            return 'custom';
    }
};

export default function LayoutTemplateDropdown({
    currentLayoutType,
    setCurrentLayoutType,
    layout,
}: {
    currentLayoutType: LayoutType;
    setCurrentLayoutType: (layoutType: LayoutType) => void;
    layout: Layout;
}) {
    const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
    // const [currentLayoutType, setCurrentLayoutType] = useState<LayoutType>('two-columns-equal');

    const handleChangeTemplate = (templateType: LayoutType) => {
        setCurrentLayoutType(templateType);
        setIsTemplateDropdownOpen(false);
    };

    return (
        <div className={styles.templateDropdown}>
            <button
                className={styles.templateDropdownButton}
                onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
            >
                {getLayoutTypeName(layout.gridStructure.columns)} {isTemplateDropdownOpen ? '▲' : '▼'}
            </button>

            {isTemplateDropdownOpen && (
                <div className={styles.templateDropdownMenu}>
                    <button
                        className={`${styles.templateOption} ${currentLayoutType === 'two-columns-equal' ? styles.active : ''}`}
                        onClick={() => handleChangeTemplate('two-columns-equal')}
                    >
                        <div className={styles.templateIcon}>
                            <TwoColumnsIcon />
                        </div>
                        <span>2 столбца - равные</span>
                    </button>
                    <button
                        className={`${styles.templateOption} ${currentLayoutType === 'two-columns-left' ? styles.active : ''}`}
                        onClick={() => handleChangeTemplate('two-columns-left')}
                    >
                        <div className={styles.templateIcon}>
                            <TwoColumnsLeftIcon />
                        </div>
                        <span>2 столбца - слева</span>
                    </button>
                    <button
                        className={`${styles.templateOption} ${currentLayoutType === 'two-columns-right' ? styles.active : ''}`}
                        onClick={() => handleChangeTemplate('two-columns-right')}
                    >
                        <div className={styles.templateIcon}>
                            <TwoColumnsRightIcon />
                        </div>
                        <span>2 столбца - справа</span>
                    </button>
                    <button
                        className={`${styles.templateOption} ${currentLayoutType === 'three-columns' ? styles.active : ''}`}
                        onClick={() => handleChangeTemplate('three-columns')}
                    >
                        <div className={styles.templateIcon}>
                            <ThreeColumnsIcon />
                        </div>
                        <span>3 столбца</span>
                    </button>
                    <button
                        className={`${styles.templateOption} ${currentLayoutType === 'four-columns' ? styles.active : ''}`}
                        onClick={() => handleChangeTemplate('four-columns')}
                    >
                        <div className={styles.templateIcon}>
                            <FourColumnsIcon />
                        </div>
                        <span>4 столбца</span>
                    </button>
                </div>
            )}
        </div>
    );
}
