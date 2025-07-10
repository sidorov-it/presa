import styles from './heading.module.css';

interface HeadingProps {
    title: string;
    description?: string;
    withoutMargin?: boolean;
}

export function Heading({ title, description, withoutMargin }: HeadingProps) {
    return (
        <div className={`${styles.container} ${withoutMargin ? styles.withoutMargin : ''}`}>
            <h1 className={styles.title}>{title}</h1>
            {description && <p className={styles.description}>{description}</p>}
        </div>
    );
}
