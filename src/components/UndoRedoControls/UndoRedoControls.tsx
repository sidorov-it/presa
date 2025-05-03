import React, { useCallback, useEffect, MutableRefObject, useState } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { TipTapRefs } from '@/types';
import styles from './UndoRedoControls.module.css';
import { useHistoryStore } from '@/store/historyStore';

interface UndoRedoControlsProps {
    presentationId: string;
    className?: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({ presentationId, className = '', tiptapRefs }) => {
    const [activePresentation, setActivePresentation] = useState<string | null>(null);

    const historyStore = useHistoryStore();
    const presentationStore = usePresentationStore();
    const presentations = presentationStore.presentations;

    useEffect(() => {
        if (presentations.length > 0 && !activePresentation) {
            // Use the first presentation in the list as active
            setActivePresentation(presentations[0]?.id || null);
        }
    }, [presentations, activePresentation]);

    const hasUndo = historyStore.canUndo(activePresentation);
    const hasRedo = historyStore.canRedo(activePresentation);

    const handleUndo = useCallback(() => {
        if (hasUndo) {
            usePresentationStore.getState().undo(presentationId, tiptapRefs);
        }
    }, [hasUndo, presentationId, tiptapRefs]);

    const handleRedo = useCallback(() => {
        if (hasRedo) {
            usePresentationStore.getState().redo(presentationId, tiptapRefs);
        }
    }, [hasRedo, presentationId, tiptapRefs]);

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
    }, [hasUndo, hasRedo, presentationId, handleUndo, handleRedo]);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                className={styles.undoButton}
                onClick={handleUndo}
                disabled={!hasUndo}
                aria-label="Undo"
                title="Undo (Ctrl+Z)"
                tabIndex={0}
            >
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                className={styles.redoButton}
                onClick={handleRedo}
                disabled={!hasRedo}
                aria-label="Redo"
                title="Redo (Ctrl+Y)"
                tabIndex={0}
            >
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
