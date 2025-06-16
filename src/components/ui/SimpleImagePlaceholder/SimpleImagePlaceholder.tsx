import React from 'react';
import { FaRegImage } from 'react-icons/fa6';
import styles from './SimpleImagePlaceholder.module.css';

const SimpleImagePlaceholder: React.FC = () => {
    return (
        <div className={styles.container}>
            <FaRegImage className={styles.imagePlaceholderIcon} aria-label="Изображение" />
        </div>
    );
};

export default SimpleImagePlaceholder;
