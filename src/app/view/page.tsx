'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function ViewerHomePage() {
    const router = useRouter();

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Presentation Viewer</h1>
            <p className={styles.description}>To view a presentation, you need to provide its ID in the URL.</p>
            <button onClick={() => router.push('/dashboard')} className={styles.button}>
                Go to Dashboard
            </button>
        </div>
    );
}
