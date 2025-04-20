import React from 'react';
import { FiCheck, FiAlertCircle } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

import styles from './SaveStatus.module.css';

interface SaveStatusProps {
    status: 'idle' | 'saving' | 'saved' | 'error';
}

const SaveStatus: React.FC<SaveStatusProps> = ({ status }) => {
    if (status === 'idle') {
        return null; // Don't show anything when idle
    }

    return (
        <div className={styles.saveStatusContainer}>
            {status === 'saving' && (
                <>
                    <AiOutlineLoading3Quarters className={styles.savingIcon} />
                    <span className={styles.savingText}>Saving...</span>
                </>
            )}
            {status === 'saved' && (
                <>
                    <FiCheck className={styles.savedIcon} />
                    <span className={styles.savedText}>Saved</span>
                </>
            )}
            {status === 'error' && (
                <>
                    <FiAlertCircle className={styles.errorText} />
                    <span className={styles.errorText}>Save failed</span>
                </>
            )}
        </div>
    );
};

export default SaveStatus;
