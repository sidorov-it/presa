'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FaTrashRestore, FaTrashAlt, FaRegClock } from 'react-icons/fa';
import { toast } from 'sonner';
import { pluralize } from '@/utils/helpers';

interface DeletedPresentation {
    id: string;
    title: string;
    deletedAt: string;
    slides: any[];
}

export default function TrashPage() {
    const { data: session } = useSession();
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
        return diffDays === 0 ? 'Сегодня' : diffDays === 1 ? 'Вчера' : `${diffDays} дней назад`;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Корзина</h1>
                <p className="text-gray-600 mt-2">
                    Удаленные презентации хранятся 30 дней перед окончательным удалением
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : deletedPresentations.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="mb-4 flex justify-center">
                        <FaTrashAlt className="text-gray-400 text-4xl" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Ваша корзина пуста</h2>
                    <p className="text-gray-500">
                        Здесь будут отображаться удаленные презентации
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Презентация
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Удалено
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Слайды
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Действия
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {deletedPresentations.map((presentation) => (
                                <tr key={presentation.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{presentation.title}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <FaRegClock className="mr-1 text-gray-400" />
                                            {formatRelativeTime(presentation.deletedAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {pluralize(presentation.slides.length, ['слайд', 'слайда', 'слайдов'])}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleRestore(presentation.id)}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            <FaTrashRestore className="inline mr-1" />
                                            Восстановить
                                        </button>
                                        <button
                                            onClick={() => handleDelete(presentation.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <FaTrashAlt className="inline mr-1" />
                                            Удалить
                                        </button>
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