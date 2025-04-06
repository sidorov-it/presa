'use client';

import { useRouter } from 'next/navigation';

export default function ViewerHomePage() {
    const router = useRouter();

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Presentation Viewer</h1>
            <p className="text-gray-600 text-lg max-w-md text-center mb-8">
        To view a presentation, you need to provide its ID in the URL.
            </p>
            <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
        Go to Dashboard
            </button>
        </div>
    );
}