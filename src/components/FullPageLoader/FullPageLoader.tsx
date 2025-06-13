import Portal from '../Portal';

import styles from './style.module.css';

export default function FullPageLoader() {
    return (
        <Portal>
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
            </div>
        </Portal>
    );
}
