'use client';

import { useState, useEffect } from 'react';
// import { useSession } from 'next-auth/react';
import { FaTrashRestore, FaTrashAlt, FaRegClock } from 'react-icons/fa';
import { toast } from 'sonner';
import { pluralize } from '@/utils/helpers';
import styles from './page.module.css';


interface DeletedPresentation {
    id: string;
    title: string;
    deletedAt: string;
    slides: any[];
}

export default function TrashPage() {
    // const { data: session } = useSession();
    const [deletedPresentations, setDeletedPresentations] = useState<DeletedPresentation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDeletedPresentations = async () => {
            try {
                const response = await fetch('/api/presentations/trash');
                if (!response.ok) {
                    throw new Error('Не удалось загрузить удаленные презентации');
                }
                const data = await response.json();
                setDeletedPresentations(data);
            } catch (error) {
                console.error('Ошибка при загрузке удаленных презентаций:', error);
                toast.error('Не удалось загрузить удаленные презентации');
            } finally {
                setIsLoading(false);
            }
        };

        loadDeletedPresentations();
    }, []);

    const handleRestore = async (id: string) => {
        try {
            const response = await fetch('/api/presentations/trash', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                throw new Error('Не удалось восстановить презентацию');
            }

            setDeletedPresentations(prev => prev.filter(p => p.id !== id));
            toast.success('Презентация успешно восстановлена');
        } catch (error) {
            console.error('Ошибка при восстановлении презентации:', error);
            toast.error('Не удалось восстановить презентацию');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Вы уверены, что хотите навсегда удалить эту презентацию? Это действие нельзя отменить.')) {
            return;
        }

        try {
            const response = await fetch(`/api/presentations/trash?id=${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Не удалось удалить презентацию');
            }

            setDeletedPresentations(prev => prev.filter(p => p.id !== id));
            toast.success('Презентация окончательно удалена');
        } catch (error) {
            console.error('Ошибка при удалении презентации:', error);
            toast.error('Не удалось удалить презентацию');
        }
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
            return 'Сегодня';
        } else if (diffDays === 1) {
            return 'Вчера';
        } else {
            return `${diffDays} дней назад`;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Корзина</h1>
                <p className={styles.description}>
                    Удаленные презентации хранятся 30 дней перед окончательным удалением
                </p>
            </div>

            {isLoading && (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                </div>
            )}
            {!isLoading && deletedPresentations.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIconContainer}>
                        <FaTrashAlt className={styles.emptyIcon} />
                    </div>
                    <h2 className={styles.emptyTitle}>Ваша корзина пуста</h2>
                    <p className={styles.emptyText}>Здесь будут отображаться удаленные презентации</p>
                </div>
            ) : (
                <div className={styles.table}>
                    <table>
                        <thead className={styles.tableHeader}>
                            <tr>
                                <th className={styles.tableHeaderCell}>Презентация</th>
                                <th className={styles.tableHeaderCell}>Удалено</th>
                                <th className={styles.tableHeaderCell}>Слайды</th>
                                <th className={styles.tableHeaderCellRight}>Действия</th>
                            </tr>
                        </thead>
                        <tbody className={styles.tableBody}>
                            {deletedPresentations.map(presentation => (
                                <tr key={presentation.id} className={styles.tableRow}>
                                    <td className={styles.tableCell}>
                                        <div className={styles.presentationTitle}>{presentation.title}</div>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div className={styles.timeInfo}>
                                            <FaRegClock className={styles.timeIcon} />
                                            {formatRelativeTime(presentation.deletedAt)}
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div className={styles.slidesCount}>
                                            {pluralize(presentation.slides.length, ['слайд', 'слайда', 'слайдов'])}
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div className={styles.actionButtons}>
                                            <button
                                                onClick={() => handleRestore(presentation.id)}
                                                className={styles.restoreButton}
                                            >
                                                <FaTrashRestore className={styles.actionIcon} />
                                                Восстановить
                                            </button>
                                            <button
                                                onClick={() => handleDelete(presentation.id)}
                                                className={styles.deleteButton}
                                            >
                                                <FaTrashAlt className={styles.actionIcon} />
                                                Удалить
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
