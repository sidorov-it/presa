/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/label-has-associated-control */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
import { useThemeStore } from '@/store/themeStore';
import SlidePreview from './components/SlidePreview';
import { resetThemeStyles } from '@/utils/themeUtils';
import { FaPlus, FaMagic, FaEllipsisV, FaPencilAlt, FaCopy, FaTrash, FaEye } from 'react-icons/fa';
import { IPresentation } from '@/types';
import { pluralize } from '@/utils/helpers';
import styles from './page.module.css';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function DashboardPage() {
    const router = useRouter();
    const { presentations, createPresentation, loadPresentationsList, deletePresentation } = usePresentationStore();
    const { setCurrentTheme, loadThemes, themes, getDefaultTheme } = useThemeStore();
    const [showAIModal, setShowAIModal] = useState(false);
    const [userPresentations, setUserPresentations] = useState<IPresentation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [presentationToRename, setPresentationToRename] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [presentationToDelete, setPresentationToDelete] = useState<string | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);

    // AI form state
    const [aiPrompt, setAiPrompt] = useState('');
    const [numSlides, setNumSlides] = useState(5);
    const [language, setLanguage] = useState('ru');
    const [aiError, setAiError] = useState('');

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

    // This effect updates the local state when presentations change in the store
    useEffect(() => {
        setUserPresentations(presentations);
    }, [presentations]);

    // Handle creating an empty presentation
    const handleCreateEmptyPresentation = async () => {
        setCurrentTheme(null);
        resetThemeStyles();

        const presentationId = await createPresentation('Новая презентация');
        router.push(`/docs/${presentationId}`);
    };

    // Handle opening the AI modal
    const handleCreateWithAI = () => {
        router.push('/dashboard/ai');
    };

    // Handle opening a presentation
    const handleOpenPresentation = (presentationId: string) => {
        router.push(`/docs/${presentationId}`);
    };

    // Handle opening a presentation in view mode
    const handleViewPresentation = (presentationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
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
        setPresentationToDelete(id);
        setShowDeleteModal(true);
        setActiveMenu(null);
    };

    // Handle the delete action
    const handleDelete = async () => {
        if (!presentationToDelete) return;

        try {
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
        }
    };

    // Handle submitting the AI form
    const handleAISubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!aiPrompt.trim()) {
            setAiError('Пожалуйста, введите запрос');
            return;
        }

        try {
            setIsGenerating(true);
            setAiError('');

            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    numSlides,
                    language,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Не удалось создать презентацию');
            }

            // Close modal and navigate to the new presentation
            setShowAIModal(false);
            router.push(`/docs/${data.presentationId}`);
        } catch (error) {
            console.error('Ошибка генерации с ИИ:', error);
            setAiError(error instanceof Error ? error.message : 'Произошла ошибка');
        } finally {
            setIsGenerating(false);
        }
    };

    // Fill the example prompt
    const handleExampleClick = (example: string) => {
        setAiPrompt(example);
    };

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

            {/* Loading state */}
            {isLoading && (
                <div className={styles.loadingSpinner}>
                    <div className={styles.spinner}></div>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && userPresentations.length === 0 ? (
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
            ) : (
                <div className={styles.presentationsGrid}>
                    {userPresentations.map(presentation => {
                        const theme = themes.find(t => t.id === presentation.themeId) || getDefaultTheme();
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

                                    <button onClick={e => toggleMenu(presentation.id, e)} className={styles.menuButton}>
                                        <FaEllipsisV />
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
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* AI Modal */}
            {showAIModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalBody}>
                            <h2 className={styles.modalTitle}>Создать презентацию с помощью ИИ</h2>

                            <form onSubmit={handleAISubmit}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Опишите, о чем должна быть ваша презентация</label>
                                    <textarea
                                        value={aiPrompt}
                                        onChange={e => setAiPrompt(e.target.value)}
                                        placeholder="Например: Презентация о влиянии искусственного интеллекта на образование"
                                        className={styles.input}
                                        rows={4}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <div className={styles.formGroupRow}>
                                        <div>
                                            <label className={styles.label}>Количество слайдов</label>
                                            <select
                                                value={numSlides}
                                                onChange={e => setNumSlides(Number(e.target.value))}
                                                className={styles.select}
                                            >
                                                {[3, 5, 7, 10, 15].map(num => (
                                                    <option key={num} value={num}>
                                                        {num}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={styles.label}>Язык</label>
                                            <select
                                                value={language}
                                                onChange={e => setLanguage(e.target.value)}
                                                className={styles.select}
                                            >
                                                <option value="ru">Русский</option>
                                                <option value="en">Английский</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p className={styles.label}>Примеры запросов:</p>
                                    <div className={styles.exampleTags}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleExampleClick(
                                                    'Презентация о влиянии искусственного интеллекта на образование'
                                                )
                                            }
                                            className={styles.exampleTag}
                                        >
                                            Влияние ИИ на образование
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleExampleClick(
                                                    'Маркетинговая стратегия для нового мобильного приложения'
                                                )
                                            }
                                            className={styles.exampleTag}
                                        >
                                            Маркетинговая стратегия
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleExampleClick(
                                                    'Бизнес-план для стартапа в сфере электронной коммерции'
                                                )
                                            }
                                            className={styles.exampleTag}
                                        >
                                            Бизнес-план
                                        </button>
                                    </div>
                                </div>

                                {aiError && <div className={styles.error}>{aiError}</div>}

                                <div className={styles.modalFooter}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAIModal(false)}
                                        className={styles.buttonCancel}
                                    >
                                        Отмена
                                    </button>
                                    <button type="submit" disabled={isGenerating} className={styles.buttonPrimary}>
                                        {isGenerating ? (
                                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                                <svg
                                                    className={styles.spinner}
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        style={{ opacity: '0.25' }}
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        style={{ opacity: '0.75' }}
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                Генерация...
                                            </span>
                                        ) : (
                                            'Создать'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
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
                                <button onClick={handleDelete} className={styles.buttonDelete}>
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
