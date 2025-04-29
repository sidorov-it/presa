import React from 'react';
import { SmartLayoutType } from '@/types';
import { useMenuStore } from '@/store/menuStore';
import { usePresentationStore } from '@/store/presentationStore';

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
        <div className="flex flex-col gap-2 p-2 bg-white rounded-lg shadow-lg min-w-[200px]">
            <div className="text-sm font-medium text-gray-700 mb-2">Layout Style</div>
            <div className="grid grid-cols-3 gap-2">
                {layoutOptions.map(option => (
                    <button
                        key={option.type}
                        onClick={() => handleLayoutChange(option.type)}
                        className={`flex flex-col items-center justify-center p-2 rounded hover:bg-gray-100 transition-colors
              ${layout.smartLayout?.type === option.type ? 'bg-blue-100 hover:bg-blue-200' : ''}`}
                    >
                        <span className="text-2xl mb-1">{option.icon}</span>
                        <span className="text-xs text-center">{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SmartLayoutSwitcher;
