import React, { useEffect } from 'react';
import { usePresentationStore } from '@/store/presentationStore';

interface UndoRedoControlsProps {
    presentationId: string;
    className?: string;
}

const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({ presentationId, className = '' }) => {
    const { undo, redo } = usePresentationStore();

    // const canUndoOperation = canUndo(presentationId);
    // const canRedoOperation = canRedo(presentationId);

    const canUndoOperation = false;
    const canRedoOperation = false;

    const handleUndo = () => {
        console.log('UndoRedoControls: handleUndo');
        console.log('canUndoOperation', canUndoOperation);
        if (canUndoOperation) {
            undo(presentationId);
        }
    };

    const handleRedo = () => {
        console.log('UndoRedoControls: handleRedo');
        console.log('canRedoOperation', canRedoOperation);
        if (canRedoOperation) {
            redo(presentationId);
        }
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Undo: Ctrl+Z or Command+Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            }

            // Redo: Ctrl+Y or Ctrl+Shift+Z or Command+Shift+Z
            if (
                ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
            ) {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [canUndoOperation, canRedoOperation, presentationId, undo, redo, handleUndo, handleRedo]);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                className="p-2 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUndo}
                disabled={!canUndoOperation}
                aria-label="Undo"
                title="Undo (Ctrl+Z)"
                tabIndex={0}
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M7 12H17C19.2091 12 21 13.7909 21 16V16C21 18.2091 19.2091 20 17 20H12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M7 12L10 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M7 12L10 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
            <button
                className="p-2 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleRedo}
                disabled={!canRedoOperation}
                aria-label="Redo"
                title="Redo (Ctrl+Y)"
                tabIndex={0}
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M17 12H7C4.79086 12 3 13.7909 3 16V16C3 18.2091 4.79086 20 7 20H12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M17 12L14 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M17 12L14 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
        </div>
    );
};

export default UndoRedoControls;
