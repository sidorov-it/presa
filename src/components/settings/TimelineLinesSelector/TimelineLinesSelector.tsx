'use client';
import { Checkbox } from '@/components/ui/Checkbox';
import styles from './TimelineLinesSelector.module.css';

export default function TimelineLinesSelector({
    showLines,
    setShowLines,
}: {
    showLines: boolean;
    setShowLines: (value: boolean) => void;
}) {
    const handleChange = () => {
        setShowLines(!showLines);
    };

    return (
        <div className={styles.container}>
            <Checkbox id="timeline-lines" checked={showLines} onChange={handleChange}>
                Показывать линии
            </Checkbox>
        </div>
    );
}
