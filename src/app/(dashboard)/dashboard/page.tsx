/* eslint-disable jsx-a11y/label-has-associated-control */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
import { FaPlus, FaMagic, FaEllipsisV, FaPencilAlt, FaCopy, FaTrash } from 'react-icons/fa';
import { IPresentation } from '@/types';
import { pluralize } from '@/utils/helpers';

type PresentationInfo = IPresentation & {
    slidesCount: number;
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const { presentations, createPresentation, loadPresentationsList, deletePresentation } = usePresentationStore();
    const [showAIModal, setShowAIModal] = useState(false);
    const [userPresentations, setUserPresentations] = useState<PresentationInfo[]>([]);
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

    // Close menu when clicking outside
    // useEffect(() => {
    //     const handleClickOutside = (event: MouseEvent) => {
    //         if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
    //             setActiveMenu(null);
    //         }
    //     };

    //     document.addEventListener('mousedown', handleClickOutside);
    //     return () => {
    //         document.removeEventListener('mousedown', handleClickOutside);
    //     };
    // }, []);

    // Handle creating an empty presentation
    const handleCreateEmptyPresentation = async () => {
        const presentationId = await createPresentation('Новая презентация');
        router.push(`/docs/${presentationId}`);
    };

    // Handle opening the AI modal
    const handleCreateWithAI = () => {
        setShowAIModal(true);
    };

    // Handle opening a presentation
    const handleOpenPresentation = (presentationId: string) => {
        router.push(`/docs/${presentationId}`);
    };

    // Toggle menu visibility
    const toggleMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === id ? null : id);
    };

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

            const response = await fetch('/api/presentations/ai', {
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


    console.log('activeMenu', activeMenu)
    console.log('showDeleteModal', showDeleteModal  )
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Мои презентации</h1>
                <div className="mt-4 md:mt-0 space-x-4 flex">
                    <button
                        onClick={handleCreateWithAI}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <FaMagic className="mr-2" />
                        Создать с ИИ
                    </button>
                    <button
                        onClick={handleCreateEmptyPresentation}
                        className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                    >
                        <FaPlus className="mr-2" />
                        Создать пустую
                    </button>
                </div>
            </div>

            {/* Presentations grid */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : userPresentations.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">У вас еще нет презентаций</h2>
                    <p className="text-gray-500 mb-6">
                        Создайте свою первую презентацию, используя шаблон или начните с нуля
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={handleCreateWithAI}
                            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <FaMagic className="mr-2" />
                            Создать с ИИ
                        </button>
                        <button
                            onClick={handleCreateEmptyPresentation}
                            className="flex items-center justify-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                        >
                            <FaPlus className="mr-2" />
                            Создать пустую
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userPresentations.map((presentation) => (
                        <div
                            key={presentation.id}
                            onClick={() => handleOpenPresentation(presentation.id)}
                            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        >
                            <div className="h-40 bg-gray-200 relative">
                                {/* Slide preview would go here */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-gray-500 font-medium">Предпросмотр</span>
                                </div>

                                {/* Action menu button */}
                                <button
                                    onClick={(e) => toggleMenu(presentation.id, e)}
                                    className="absolute top-2 right-2 p-2 text-gray-600 hover:bg-gray-300 rounded-full"
                                >
                                    <FaEllipsisV />
                                </button>

                                {/* Action menu */}
                                {activeMenu === presentation.id && (
                                    <div
                                        ref={menuRef}
                                        className="absolute top-10 right-2 bg-white rounded-md shadow-lg z-10"
                                    >
                                        <div className="py-1">
                                            <button
                                                onClick={(e) => handleRenameClick(presentation.id, e)}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <FaPencilAlt className="mr-2" />
                                                Переименовать
                                            </button>
                                            <button
                                                onClick={(e) => handleDuplicate(presentation.id, e)}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <FaCopy className="mr-2" />
                                                Дублировать
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteClick(presentation.id, e)}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                            >
                                                <FaTrash className="mr-2" />
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-gray-800 mb-1 truncate">{presentation.title}</h3>
                                <p className="text-sm text-gray-500">
                                    {pluralize(presentation.slides.length, ['слайд', 'слайда', 'слайдов'])}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* AI Modal */}
            {showAIModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Создать презентацию с помощью ИИ</h2>

                            <form onSubmit={handleAISubmit}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Опишите, о чем должна быть ваша презентация
                                    </label>
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="Например: Презентация о влиянии искусственного интеллекта на образование"
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={4}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Количество слайдов
                                        </label>
                                        <select
                                            value={numSlides}
                                            onChange={(e) => setNumSlides(Number(e.target.value))}
                                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {[3, 5, 7, 10, 15].map(num => (
                                                <option key={num} value={num}>{num}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Язык
                                        </label>
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="ru">Русский</option>
                                            <option value="en">Английский</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <p className="text-sm text-gray-600 mb-2">Примеры запросов:</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleExampleClick("Презентация о влиянии искусственного интеллекта на образование")}
                                            className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1"
                                        >
                                            Влияние ИИ на образование
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleExampleClick("Маркетинговая стратегия для нового мобильного приложения")}
                                            className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1"
                                        >
                                            Маркетинговая стратегия
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleExampleClick("Бизнес-план для стартапа в сфере электронной коммерции")}
                                            className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1"
                                        >
                                            Бизнес-план
                                        </button>
                                    </div>
                                </div>

                                {aiError && (
                                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                                        {aiError}
                                    </div>
                                )}

                                <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAIModal(false)}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isGenerating}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                                    >
                                        {isGenerating ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Генерация...
                                            </span>
                                        ) : "Создать"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            {showRenameModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Переименовать презентацию</h2>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Название презентации"
                                />
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={() => setShowRenameModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleRename}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">Удалить презентацию?</h2>
                            <p className="text-gray-600 mb-6">
                                Презентация будет перемещена в корзину и доступна для восстановления в течение 30 дней.
                            </p>
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
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