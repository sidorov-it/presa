/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/label-has-associated-control */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
import { useThemeStore } from '@/store/themeStore';
import SlidePreview from './components/SlidePreview';
import { FaPlus, FaMagic, FaPencilAlt, FaCopy, FaTrash, FaEye } from 'react-icons/fa';
import { IPresentation } from '@/types';
import { pluralize, formatRelativeTime } from '@/utils/helpers';
import styles from './page.module.css';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { HiOutlineDotsVertical } from 'react-icons/hi';

export default function DashboardPage() {
    const router = useRouter();
    const { presentations, createPresentation, loadPresentationsList, deletePresentation } = usePresentationStore();
    const { setCurrentTheme, loadThemes, themes } = useThemeStore();
    const [userPresentations, setUserPresentations] = useState<IPresentation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [presentationToRename, setPresentationToRename] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [presentationToDelete, setPresentationToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const defaultThemes = useThemeStore(state => state.defaultThemes);

    const menuRef = useRef<HTMLDivElement>(null);

    type SortOption = 'createdAt' | 'updatedAt' | 'title';
    const [sortBy, setSortBy] = useState<SortOption>('updatedAt');


    // Load themes for previews
    useEffect(() => {
        loadThemes().catch(err => {
            console.error('Failed to load themes:', err);
        });
    }, [loadThemes]);

    // Fetch user's presentations from the database
    useEffect(() => {
        const loadPresentations = async () => {
            try {
                setIsLoading(true);
                await loadPresentationsList();
            } catch (error) {
                console.error('Не удалось загрузить презентации:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPresentations();
    }, [loadPresentationsList]);

    // Update local state when presentations or sorting change
    useEffect(() => {
        const sorted = [...presentations].sort((a, b) => {
            if (sortBy === 'title') {
                return a.title.localeCompare(b.title);
            } else {
                return new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime();
            }
        });
        setUserPresentations(sorted);
    }, [presentations, sortBy]);

    // Handle creating an empty presentation
    const handleCreateEmptyPresentation = async () => {
        setCurrentTheme(defaultThemes[0]);

        const presentationId = await createPresentation('Новая презентация');
        router.push(`/docs/${presentationId}`);
    };

    // Handle opening the AI modal
    const handleCreateWithAI = () => {
        router.push('/dashboard/ai');
    };

    // Handle opening a presentation in view mode
    const handleViewPresentation = (presentationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setActiveMenu(null);
        router.push(`/view/${presentationId}`);
    };

    const handleDocumentClick = useCallback((e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setActiveMenu(null);
            document.removeEventListener('click', handleDocumentClick);
        }
    }, []);

    // Toggle menu visibility
    const toggleMenu = useCallback(
        (id: string, e: React.MouseEvent) => {
            e.stopPropagation();
            const isOpen = activeMenu !== id;
            setActiveMenu(isOpen ? id : null);
            if (isOpen) {
                document.addEventListener('click', handleDocumentClick);
            }
        },
        [activeMenu, handleDocumentClick]
    );

    // Handle duplicating a presentation
    const handleDuplicate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setActiveMenu(null);

        try {
            setIsLoading(true);
            const response = await fetch(`/api/presentations/${id}/duplicate`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Не удалось дублировать презентацию');
            }

            // Refresh presentations list
            await loadPresentationsList();
        } catch (error) {
            console.error('Не удалось дублировать презентацию:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Open rename modal
    const handleRenameClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const presentation = presentations.find(p => p.id === id);
        if (presentation) {
            setNewTitle(presentation.title);
            setPresentationToRename(id);
            setShowRenameModal(true);
        }
        setActiveMenu(null);
    };

    // Handle the rename action
    const handleRename = async () => {
        if (!presentationToRename || !newTitle.trim()) return;

        try {
            const response = await fetch(`/api/presentations/${presentationToRename}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: newTitle.trim() }),
            });

            if (!response.ok) {
                throw new Error('Не удалось переименовать презентацию');
            }

            // Refresh presentations list
            await loadPresentationsList();
            setShowRenameModal(false);
            setPresentationToRename(null);
            setNewTitle('');
        } catch (error) {
            console.error('Ошибка при переименовании презентации:', error);
        }
    };

    // Open delete confirmation modal
    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setPresentationToDelete(id);
        setShowDeleteModal(true);
        setActiveMenu(null);
    };

    // Handle the delete action
    const handleDelete = async () => {
        if (!presentationToDelete) return;

        try {
            setIsDeleting(true);
            const response = await fetch(`/api/presentations/${presentationToDelete}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Не удалось удалить презентацию');
            }

            // Remove from local state
            deletePresentation(presentationToDelete);
            setShowDeleteModal(false);
            setPresentationToDelete(null);
        } catch (error) {
            console.error('Ошибка при удалении презентации:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleMenuClick = useCallback(
        (id: string) => (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            toggleMenu(id, e);
        },
        [toggleMenu]
    );

    const defaultTheme = defaultThemes[0];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Мои презентации</h1>
                <div className={styles.buttonGroup}>
                    <Button variant="premium" onClick={handleCreateWithAI}>
                        <FaMagic className={styles.buttonIcon} />
                        Создать с ИИ
                    </Button>
                    <Button variant="solid" onClick={handleCreateEmptyPresentation}>
                        <FaPlus className={styles.buttonIcon} />
                        Создать пустую
                    </Button>
                </div>
            </div>
            <div className={styles.sortContainer}>
                <label className={styles.sortLabel} htmlFor="sort">
                    Сортировать по:
                </label>
                <select
                    id="sort"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className={styles.sortSelect}
                >
                    <option value="createdAt">дате создания</option>
                    <option value="updatedAt">дате редактирования</option>
                    <option value="title">заголовку</option>
                </select>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className={styles.loadingSpinner}>
                    <div className={styles.spinner}></div>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && userPresentations.length === 0 && (
                <div className={styles.emptyState}>
                    <h2 className={styles.emptyStateTitle}>У вас еще нет презентаций</h2>
                    <p className={styles.emptyStateText}>
                        Создайте свою первую презентацию, используя шаблон или начните с нуля
                    </p>
                    <div className={styles.emptyStateButtons}>
                        <Button variant="premium" onClick={handleCreateWithAI}>
                            <FaMagic className={styles.buttonIcon} />
                            Создать с ИИ
                        </Button>
                        <Button variant="solid" onClick={handleCreateEmptyPresentation}>
                            <FaPlus className={styles.buttonIcon} />
                            Создать пустую
                        </Button>
                    </div>
                </div>
            )}

            {!isLoading && userPresentations.length > 0 && (
                <div className={styles.presentationsGrid}>
                    {userPresentations.map(presentation => {
                        const theme = themes.find(t => t.id === presentation.themeId) || defaultTheme;

                        return (
                            <Link
                                href={`/docs/${presentation.id}`}
                                key={presentation.id}
                                className={styles.presentationCard}
                            >
                                {/* <div
                                key={presentation.id}
                                onClick={() => handleOpenPresentation(presentation.id)}
                                className={styles.presentationCard}
                            > */}
                                <div className={styles.previewArea}>
                                    <div className={styles.previewAreaLink} />
                                    <SlidePreview presentation={presentation} theme={theme} />

                                    <button onClick={handleMenuClick(presentation.id)} className={styles.menuButton}>
                                        <HiOutlineDotsVertical />
                                    </button>

                                    {activeMenu === presentation.id && (
                                        <div ref={menuRef} className={styles.menuDropdown}>
                                            <button
                                                onClick={e => handleViewPresentation(presentation.id, e)}
                                                className={styles.menuItem}
                                            >
                                                <FaEye className={styles.menuIcon} />
                                                Просмотр
                                            </button>
                                            <button
                                                onClick={e => handleRenameClick(presentation.id, e)}
                                                className={styles.menuItem}
                                            >
                                                <FaPencilAlt className={styles.menuIcon} />
                                                Переименовать
                                            </button>
                                            <button
                                                onClick={e => handleDuplicate(presentation.id, e)}
                                                className={styles.menuItem}
                                            >
                                                <FaCopy className={styles.menuIcon} />
                                                Дублировать
                                            </button>
                                            <button
                                                onClick={e => handleDeleteClick(presentation.id, e)}
                                                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                            >
                                                <FaTrash className={styles.menuIcon} />
                                                Удалить
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.cardContent}>
                                    <h3 className={styles.cardTitle}>{presentation.title}</h3>
                                    <p className={styles.cardSubtitle}>
                                        {pluralize(presentation.slides.length, ['слайд', 'слайда', 'слайдов'])}
                                    </p>
                                    <p className={styles.cardTimestamp}>
                                        Редактировано {formatRelativeTime(presentation.updatedAt)}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Rename Modal */}
            {showRenameModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalBody}>
                            <h2 className={styles.modalTitle}>Переименовать презентацию</h2>
                            <div className={styles.formGroup}>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    className={styles.input}
                                    placeholder="Название презентации"
                                />
                            </div>
                            <div className={styles.modalFooter}>
                                <button onClick={() => setShowRenameModal(false)} className={styles.buttonCancel}>
                                    Отмена
                                </button>
                                <button onClick={handleRename} className={styles.buttonPrimary}>
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalBody}>
                            <h2 className={styles.modalTitle}>Удалить презентацию?</h2>
                            <p className={styles.emptyStateText}>
                                Презентация будет перемещена в корзину и доступна для восстановления в течение 30 дней.
                            </p>
                            <div className={styles.modalFooter}>
                                <button onClick={() => setShowDeleteModal(false)} className={styles.buttonCancel}>
                                    Отмена
                                </button>
                                <button onClick={handleDelete} disabled={isDeleting} className={styles.buttonDelete}>
                                    {isDeleting ? <div className={styles.buttonSpinner}></div> : 'Удалить'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
