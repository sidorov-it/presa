'use client';
import ColorPicker from '@/components/ui/ColorPicker';
import styles from './TimelineColorSelector.module.css';

export default function TimelineColorSelector({
    color,
    setColor,
}: {
    color: string;
    setColor: (value: string) => void;
}) {
    return (
        <div className={styles.container}>
            <div className={styles.label}>Цвет линии</div>
            <ColorPicker
                value={color || '#1e88e5'}
                onChange={setColor}
                className={styles.colorPicker}
            />
        </div>
    );
} 