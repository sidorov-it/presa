import { ThemeDesignShadow } from '@/types/theme';
import styles from './ShadowSelector.module.css';

export default function ShadowSelector({
    value,
    onChange,
}: {
    value: ThemeDesignShadow;
    onChange: (value: ThemeDesignShadow) => void;
}) {
    return (
        <div style={{ display: 'flex', marginTop: '0.5rem', gap: '0.5rem' }}>
            {
                /** TODO: вынести в констранты
                 * дублируется в useThemeApplication.ts
                 */
                [
                    { value: 'none', shadow: 'none' },
                    { value: 'sm', shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
                    { value: 'md', shadow: '8px 8px 0px 0px rgb(0 0 0 / 0.1)' },
                ].map(option => (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value as ThemeDesignShadow)}
                        className={`${styles.shadowButton} ${value === option.value ? styles.shadowActive : ''}`}
                        aria-label={`Тень ${option.value}`}
                    >
                        <div className={`${styles.shadowContent} ${styles[`shadow-${option.value}`]}`} />
                    </button>
                ))
            }
        </div>
    );
}
