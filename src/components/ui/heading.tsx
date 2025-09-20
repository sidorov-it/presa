import styles from './heading.module.css';

interface HeadingProps {
    title: string;
    description?: string | React.ReactNode;
    withoutMargin?: boolean;
    rightElement?: React.ReactNode;
}

export function Heading({ title, description, withoutMargin, rightElement }: HeadingProps) {
    return (
        <div className={`${styles.container} ${withoutMargin ? styles.withoutMargin : ''}`}>
            <div className={styles.header}>
                <div className={styles.textContent}>
                    <h1 className={styles.title}>{title}</h1>
                    {description && <p className={styles.description}>{description}</p>}
                </div>
                {rightElement && <div className={styles.rightElement}>{rightElement}</div>}
            </div>
        </div>
    );
}
