import { BiAlignLeft, BiAlignMiddle, BiAlignRight } from 'react-icons/bi';

import styles from './AlignmentGroup.module.css';

export default function AlignmentGroup({
    element,
    handleChange,
}: {
    element: { align: 'left' | 'center' | 'right' };
    handleChange: (alignment: 'left' | 'center' | 'right') => void;
}) {
    return (
        <div className={styles.alignmentGroup}>
            <button
                onClick={() => handleChange('left')}
                className={`${styles.button} ${element.align === 'left' ? styles.active : ''}`}
                aria-label="По левому краю"
            >
                <BiAlignLeft size={16} />
            </button>
            <button
                onClick={() => handleChange('center')}
                className={`${styles.button} ${element.align === 'center' ? styles.active : ''}`}
                aria-label="По центру"
            >
                <BiAlignMiddle size={16} />
            </button>
            <button
                onClick={() => handleChange('right')}
                className={`${styles.button} ${element.align === 'right' ? styles.active : ''}`}
                aria-label="По правому краю"
            >
                <BiAlignRight size={16} />
            </button>
        </div>
    );
}
