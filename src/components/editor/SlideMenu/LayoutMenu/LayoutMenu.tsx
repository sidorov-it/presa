import { AlignCenterIcon, AlignTopIcon, AlignBottomIcon, DeleteIcon } from '@/components/icons';
import styles from './LayoutMenu.module.css';
import { useSlideMenu } from '@/contexts/SlideMenuContext';

export default function LayoutMenu({
    position,
}: {
    position: { x: number, y: number }
    layoutId: string
}) {
    const { state, updateAlignLayout } = useSlideMenu();

    const handleAlignTop = () => {
        if (state.slideId && state.layoutId) {
            updateAlignLayout(state.layoutId, 'top');
            // closeMenu()
        }
    }

    const handleAlignCenter = () => {
        if (state.slideId && state.layoutId) {
            updateAlignLayout(state.layoutId, 'center');
            // closeMenu()
        }
    }

    const handleAlignBottom = () => {
        if (state.slideId && state.layoutId) {
            updateAlignLayout(state.layoutId, 'bottom');
            // closeMenu()
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
                <button className={`${styles.layoutMenuButton} ${styles.removeButton}`}>
                    <DeleteIcon />
                </button>
            </div>
        </div>
    )
}