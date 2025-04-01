'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
// import Editor from '@/components/editor/Editor';
import { useSession } from 'next-auth/react';
import Editor from '@/components/editor/Editor/Editor';
import { IPresentation } from '@/types';
import UndoRedoControls from '@/components/UndoRedoControls';
import SaveStatus from '@/components/ui/SaveStatus';

export default function PresentationEditorPage() {
    const params = useParams();

    const { id } = params;
    const { data: session, status } = useSession();
    const { loadPresentation } = usePresentationStore();
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const { savingStatus } = usePresentationStore();

    const [presentation, setPresentation] = useState<IPresentation | null>(null);
    useEffect(() => {
        if (status === 'loading') return;

        // Ensure presentation exists and belongs to user
        const load = async () => {
            const loadedPresentation = await loadPresentation(id as string);
            if (!loadedPresentation) {
                setNotFound(true);
            } else {
                setPresentation(loadedPresentation);
            }
            setIsLoading(false);

        };

        load();

    }, [id, loadPresentation, status]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (notFound || !presentation) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Presentation Not Found</h1>
                <p className="text-gray-600">The presentation you're looking for doesn't exist or you don't have access to it.</p>
            </div>
        );
    }

    console.log('Editor', Editor)
    console.log('id', id)

    return (
        <div className="min-h-screen flex flex-col">
            {/* <header className="bg-white border-b border-gray-200 py-2 px-4">
                <div className="container mx-auto flex items-center justify-between">
                    <a href="/dashboard" className="text-xl font-bold text-blue-600">Presa</a>
                    <div className="flex items-center space-x-2">
                        {session?.user?.name && (
                            <div className="text-sm text-gray-600">{session.user.name}</div>
                        )}
                    </div>
                </div>
            </header> */}


            <header className="bg-white border-b border-gray-200 p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <a href='/dashboard' className="text-2xl font-bold text-blue-600">Presa</a>
                        <SaveStatus status={savingStatus} />
                    </div>

                    <div className="flex items-center space-x-4">
                        <UndoRedoControls presentationId={presentation.id} />

                        <div className="flex items-center space-x-2">
                            {session?.user?.name && (
                                <div className="text-sm text-gray-600">{session.user.name}</div>
                            )}
                        </div>
                        {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviewToggle}
                            aria-label={showPreview ? 'Выйти из режима просмотра' : 'Предпросмотр презентации'}
                        >
                            {showPreview ? 'Редактировать' : 'Просмотр'}
                        </Button> */}

                    </div>
                </div>
            </header>
            <main className="flex-grow w-full">
                <Editor presentationId={presentation.id} />
            </main>

            <footer className="bg-gray-100 border-t border-gray-200 py-2 px-4">
                <div className="container mx-auto text-center text-sm text-gray-600">
                    Presa - Create beautiful presentations with AI
                </div>
            </footer>
        </div>
    );
} 