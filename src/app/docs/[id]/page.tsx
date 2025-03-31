'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
import Editor from '@/components/editor/Editor';
import { useSession } from 'next-auth/react';

export default function PresentationEditorPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const { getPresentation } = usePresentationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  
  useEffect(() => {
    if (status === 'loading') return;
    
    // Ensure presentation exists and belongs to user
    const presentation = getPresentation(id as string);
    if (!presentation) {
      setNotFound(true);
    }
    
    setIsLoading(false);
  }, [id, getPresentation, status]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Presentation Not Found</h1>
        <p className="text-gray-600">The presentation you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 py-2 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <a href="/dashboard" className="text-xl font-bold text-blue-600">Presa</a>
          <div className="flex items-center space-x-2">
            {session?.user?.name && (
              <div className="text-sm text-gray-600">{session.user.name}</div>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-grow w-full">
        <Editor presentationId={id as string} />
      </main>
      
      <footer className="bg-gray-100 border-t border-gray-200 py-2 px-4">
        <div className="container mx-auto text-center text-sm text-gray-600">
          Presa - Create beautiful presentations with AI
        </div>
      </footer>
    </div>
  );
} 