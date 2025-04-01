'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FaTrashRestore, FaTrashAlt, FaRegClock } from 'react-icons/fa';
import { toast } from 'sonner';

interface DeletedPresentation {
    id: string;
    title: string;
    deletedAt: string;
    slides: unknown[];
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
                    throw new Error('Failed to load deleted presentations');
                }
                const data = await response.json();
                setDeletedPresentations(data.presentations);
            } catch (error) {
                console.error('Error loading deleted presentations:', error);
                toast.error('Failed to load deleted presentations');
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
                throw new Error('Failed to restore presentation');
            }

            setDeletedPresentations(prev => prev.filter(p => p.id !== id));
            toast.success('Presentation restored successfully');
        } catch (error) {
            console.error('Error restoring presentation:', error);
            toast.error('Failed to restore presentation');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to permanently delete this presentation? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/presentations/trash?id=${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete presentation');
            }

            setDeletedPresentations(prev => prev.filter(p => p.id !== id));
            toast.success('Presentation permanently deleted');
        } catch (error) {
            console.error('Error deleting presentation:', error);
            toast.error('Failed to delete presentation');
        }
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Trash</h1>
                <p className="text-gray-600 mt-2">
                    Deleted presentations are kept for 30 days before being permanently removed
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
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Your trash is empty</h2>
                    <p className="text-gray-500">
                        Deleted presentations will appear here
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Presentation
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Deleted
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Slides
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Actions
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
                                        {presentation.slides.length} slides
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => handleRestore(presentation.id)}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            <FaTrashRestore className="inline mr-1" />
                                            Restore
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(presentation.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <FaTrashAlt className="inline mr-1" />
                                            Delete
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