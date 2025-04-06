import { AlignCenterIcon, AlignTopIcon, AlignBottomIcon, DeleteIcon } from '@/components/icons';
import styles from './LayoutMenu.module.css';
import { useSlideMenu } from '@/contexts/SlideMenuContext';
import { useEffect, useState } from 'react';
import MenuButton from '../MenuButton';
import { LayoutType } from '@/types';
// Import column layout icons from the local icons folder
import {
    TwoColumnsIcon,
    TwoColumnsLeftIcon,
    TwoColumnsRightIcon,
    ThreeColumnsIcon,
    FourColumnsIcon
} from '@/components/icons';

export default function LayoutMenu({
    position,
}: {
    position: { x: number, y: number }
    layoutId: string
}) {
    const { state, updateAlignLayout, deleteLayout, closeMenu, getLayout, changeTemplate } = useSlideMenu();
    const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);

    // Get current layout type
    const layout = state.slideId && state.layoutId ?
        getLayout(state.slideId, state.layoutId) : null;

    const currentLayoutType = layout?.type || 'custom';

    // Function to get display name for layout type
    const getLayoutTypeName = (): string => {
        switch (layout?.gridStructure.columns) {
            case 1: return '1 столбец';
            case 2: return '2 столбца';
            case 3: return '3 столбца';
            case 4: return '4 столбца';
            default: return 'custom';
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // Don't hide if clicking on the editor or the bubble menu itself
            const target = e.target as HTMLElement;
            if (target.closest('.layout-menu')) {
                return;
            }
            closeMenu();
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [closeMenu]);

    const handleAlignTop = () => {
        if (state.slideId && state.layoutId) {
            updateAlignLayout(state.layoutId, 'top');
        }
    }

    const handleAlignCenter = () => {
        if (state.slideId && state.layoutId) {
            updateAlignLayout(state.layoutId, 'center');
        }
    }

    const handleAlignBottom = () => {
        if (state.slideId && state.layoutId) {
            updateAlignLayout(state.layoutId, 'bottom');
        }
    }

    const handleDeleteLayout = () => {
        if (state.slideId && state.layoutId) {
            deleteLayout();
        }
    }

    const handleChangeTemplate = (templateType: LayoutType) => {
        if (state.slideId && state.layoutId) {
            changeTemplate(templateType);
        }

        setIsTemplateDropdownOpen(false);
    }

    return (
        <div className={`${styles.layoutMenu} layout-menu`} style={{
            top: position.y
        }}>
            <div className={styles.layoutMenuButtons}>
                <div className={styles.templateDropdown}>
                    <button
                        className={styles.templateDropdownButton}
                        onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                    >
                        {getLayoutTypeName()} {isTemplateDropdownOpen ? '▲' : '▼'}
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
                <MenuButton
                    icon={<AlignTopIcon />}
                    onClick={handleAlignTop}
                />
                <MenuButton
                    icon={<AlignCenterIcon />}
                    onClick={handleAlignCenter}
                />
                <MenuButton
                    icon={<AlignBottomIcon />}
                    onClick={handleAlignBottom}
                />
                <div className={styles.layoutMenuButtonSeparator} />
                <MenuButton
                    icon={<DeleteIcon />}
                    onClick={handleDeleteLayout}
                    color="#f00"
                />
            </div>
        </div>
    )
}