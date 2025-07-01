'use client';
import { Checkbox } from '@/components/ui/Checkbox';
import styles from './TimelineNumberingSelector.module.css';

export default function TimelineNumberingSelector({
    showNumbers,
    setShowNumbers,
}: {
    showNumbers: boolean;
    setShowNumbers: (value: boolean) => void;
}) {
    const handleChange = () => {
        setShowNumbers(!showNumbers);
    };

    return (
        <div className={styles.container}>
            <Checkbox
                id="timeline-numbering"
                checked={showNumbers}
                onChange={handleChange}
            >
                Показывать нумерацию
            </Checkbox>
        </div>
    );
} 