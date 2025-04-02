/* eslint-disable jsx-a11y/anchor-is-valid */
'use client';

import React, { useState, useEffect } from 'react';
// import { usePresentationStore } from '@/store/presentationStore';
import Editor from '@/components/editor/Editor';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
    // const { presentations, createPresentation } = usePresentationStore();
    const [selectedPresentationId] = useState<string | null>(null);
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;

        if (session) {
            router.push('/dashboard');
        } else {
            router.push('/login');
        }
    }, [session, status, router]);

    // // Обработчик создания новой презентации
    // const handleCreatePresentation = () => {
    //     createPresentation('Новая презентация');
    //     // Выбираем последнюю созданную презентацию
    //     if (presentations.length > 0) {
    //         setSelectedPresentationId(presentations[presentations.length - 1].id);
    //     }
    // };

    // Если выбрана презентация, показываем редактор
    if (selectedPresentationId) {
        return <Editor presentationId={selectedPresentationId} />;
    }

    // Иначе показываем список презентаций или предложение создать новую
    return (
        <div className="min-h-screen flex justify-center items-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
}
