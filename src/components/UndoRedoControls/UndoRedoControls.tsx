import React, { useCallback, useEffect, MutableRefObject } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { TipTapRefs } from '@/types';
import styles from './UndoRedoControls.module.css';
import { useHistoryStore } from '@/store/historyStore';
import { LuRedo2, LuUndo2 } from 'react-icons/lu';
// import UndoIcon from './undo.svg';
// import RedoIcon from './redo.svg';
// import RedoIcon from './redo.svg';

interface UndoRedoControlsProps {
    presentationId: string;
    className?: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({ presentationId, className = '', tiptapRefs }) => {
    const historyStore = useHistoryStore();

    const hasUndo = historyStore.canUndo(presentationId);
    const hasRedo = historyStore.canRedo(presentationId);

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
            const isModifierPressed = e.ctrlKey || e.metaKey;
            if (!isModifierPressed) return; // early exit if no Cmd/Ctrl pressed

            // Normalize key to lowercase to avoid issues with Shift producing uppercase letters
            const key = e.key.toLowerCase();

            // In some keyboard layouts e.key may vary, so fall back to e.code which is layout-independent
            const isZKey = key === 'z' || e.code === 'KeyZ';
            const isYKey = key === 'y' || e.code === 'KeyY';

            // Undo: Cmd/Ctrl + Z (without Shift)
            if (isZKey && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
                return; // early exit so that redo condition is not evaluated in the same cycle
            }

            // Redo can be triggered by:
            //   1. Cmd/Ctrl + Y (common on Windows/Linux)
            //   2. Cmd/Ctrl + Shift + Z (common on macOS)
            const isRedoCombination = (isYKey && !e.shiftKey) || (isZKey && e.shiftKey);
            if (isRedoCombination) {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleUndo, handleRedo]);

    return (
        <div className={`${styles.undoRedoControls} ${className}`}>
            <button
                className={styles.undoButton}
                onClick={handleUndo}
                disabled={!hasUndo}
                aria-label="Отменить"
                title="Отменить (Ctrl+Z)"
                tabIndex={0}
            >
                <div className={styles.icon}>
                    <LuUndo2 className={styles.undoIcon} />
                </div>
                {/* <svg className={styles.icon} viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                </svg> */}
            </button>
            <button
                className={styles.redoButton}
                onClick={handleRedo}
                disabled={!hasRedo}
                aria-label="Повторить"
                title="Повторить (Ctrl+Y)"
                tabIndex={0}
            >
                <div className={styles.icon}>
                    <LuRedo2 className={styles.redoIcon} />
                </div>
                {/* <svg className={styles.icon} viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                </svg> */}
            </button>
        </div>
    );
};

export default UndoRedoControls;
