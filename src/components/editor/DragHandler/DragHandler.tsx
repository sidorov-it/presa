import styles from './DragHandler.module.css';

export default function DragHandler({
    slideId,
    isActive,
    ariaLabel,
    className,
    handleClick,
    handleKeyDown,
    handleDragStart,
    horizontal = false,
    ...props
}: {
    slideId: string,
    isActive: boolean,
    ariaLabel: string,
    className: string,
    handleClick: (e: React.MouseEvent<HTMLDivElement>) => void,
    handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void,
    handleDragStart: (e: React.DragEvent<HTMLDivElement>) => void,
    horizontal?: boolean,
    [key: string]: any,
}) {
    return (
        <div
            className={`${styles.dragHandle} ${isActive ? styles.active : ''} ${className} ${horizontal ? styles.horizontal : ''}`}
            aria-label={ariaLabel}
            draggable="true"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onDragStart={handleDragStart}
            {...props}
        >
            ⋮
        </div>
    );
}