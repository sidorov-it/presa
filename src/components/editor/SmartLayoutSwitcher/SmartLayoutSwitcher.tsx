import React from 'react';
import { SmartLayoutType } from '@/types';
import { useMenuStore } from '@/store/menuStore';
import { usePresentationStore } from '@/store/presentationStore';

import styles from './SmartLayoutSwitcher.module.css';

interface SmartLayoutSwitcherProps {
    layoutId: string;
    slideId: string;
    presentationId: string;
}

const layoutOptions: { type: SmartLayoutType; label: string; icon: string }[] = [
    { type: 'bullets', label: 'Bullet List', icon: '•' },
    { type: 'text-boxes', label: 'Text Boxes', icon: '▢' },
    { type: 'image-text-grid', label: 'Image + Text', icon: '🖼' },
    { type: 'icon-text-grid', label: 'Icons + Text', icon: '🔍' },
    { type: 'timeline', label: 'Timeline', icon: '⟶' },
    { type: 'arrow-flow', label: 'Arrow Flow', icon: '↗' },
    { type: 'stats-grid', label: 'Statistics', icon: '📊' },
    { type: 'comparison', label: 'Comparison', icon: '⚖' },
    { type: 'process-flow', label: 'Process Flow', icon: '⚙' },
];

const SmartLayoutSwitcher: React.FC<SmartLayoutSwitcherProps> = ({ layoutId, slideId, presentationId }) => {
    const layout = usePresentationStore(state => state.getLayout(presentationId, slideId, layoutId));
    const changeSmartLayout = usePresentationStore(state => state.changeSmartLayout);
    const closeMenu = useMenuStore(state => state.closeMenu);

    if (!layout) return null;

    const handleLayoutChange = (type: SmartLayoutType) => {
        changeSmartLayout(presentationId, slideId, layoutId, type);
        closeMenu();
    };

    return (
        <div className={styles.smartLayoutSwitcher}>
            <div className={styles.smartLayoutSwitcherTitle}>Layout Style</div>
            <div className={styles.smartLayoutSwitcherItems}>
                {layoutOptions.map(option => (
                    <button
                        key={option.type}
                        onClick={() => handleLayoutChange(option.type)}
                        className={`${styles.smartLayoutSwitcherItem} ${layout.smartLayout?.type === option.type ? styles.smartLayoutSwitcherItemActive : ''}`}
                    >
                        <span className={styles.smartLayoutSwitcherItemIcon}>{option.icon}</span>
                        <span className={styles.smartLayoutSwitcherItemLabel}>{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SmartLayoutSwitcher;
