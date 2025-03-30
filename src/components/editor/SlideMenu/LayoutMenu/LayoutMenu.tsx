import { AlignCenterIcon, AlignTopIcon, AlignBottomIcon, DeleteIcon } from '@/components/icons';
import styles from './LayoutMenu.module.css';
import { useSlideMenu } from '@/contexts/SlideMenuContext';
import { useEffect } from 'react';

export default function LayoutMenu({
    position,
}: {
    position: { x: number, y: number }
    layoutId: string
}) {
    const { state, updateAlignLayout, deleteLayout, closeMenu } = useSlideMenu();

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

    return (
        <div className={styles.layoutMenu} style={{
            top: position.y
        }}>
            <div className={styles.layoutMenuButtons}>
                <button className={styles.layoutMenuButton} onClick={handleAlignTop}>
                    <AlignTopIcon />
                </button>
                <button className={styles.layoutMenuButton} onClick={handleAlignCenter}>
                    <AlignCenterIcon />
                </button>
                <button className={styles.layoutMenuButton} onClick={handleAlignBottom}>
                    <AlignBottomIcon />
                </button>
                <div className={styles.layoutMenuButtonSeparator} />
                <button className={`${styles.layoutMenuButton} ${styles.removeButton}`} onClick={handleDeleteLayout}>
                    <DeleteIcon />
                </button>
            </div>
        </div>
    )
}