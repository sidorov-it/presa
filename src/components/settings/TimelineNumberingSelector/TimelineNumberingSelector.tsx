'use client';
import styles from './TimelineNumberingSelector.module.css';
import IconToggle from '@/components/settings/IconToggle/IconToggle';
import { useCallback } from 'react';

export default function TimelineNumberingSelector({
    icon,
    showNumbers,
    setShowNumbers,
}: {
    icon: React.ReactNode;
    showNumbers: boolean;
    setShowNumbers: (value: boolean) => void;
}) {
    const handleChange = useCallback(() => {
        setShowNumbers(!showNumbers);
    }, [showNumbers, setShowNumbers]);

    return (
        <div className={styles.container}>
            <IconToggle icon={icon} isEnabled={showNumbers} onToggle={handleChange} ariaLabel="Toggle some feature" />
        </div>
    );
}
