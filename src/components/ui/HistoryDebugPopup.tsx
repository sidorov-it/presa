'use client';

import { useEffect, useState } from 'react';
import { useHistoryStore, HistoryAction } from '@/store/historyStore';
import { usePresentationStore } from '@/store/presentationStore';
import deepDiff from '@/utils/deepDiff';
import styles from './HistoryDebugPopup.module.css';
import { FaHistory } from 'react-icons/fa';

interface DiffItem {
    key: string;
    path: string[];
    type: 'added' | 'removed' | 'changed';
    before?: any;
    after?: any;
}

const HistoryDebugPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activePresentation, setActivePresentation] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'past' | 'future'>('past');
    const [expandedDiffs, setExpandedDiffs] = useState<Record<string, boolean>>({});

    const historyStore = useHistoryStore();
    const presentationStore = usePresentationStore();
    const presentations = presentationStore.presentations;

    // Get the active presentation from the list of presentations
    useEffect(() => {
        if (presentations.length > 0 && !activePresentation) {
            // Use the first presentation in the list as active
            setActivePresentation(presentations[0]?.id || null);
        }
    }, [presentations, activePresentation]);

    // Add keyboard shortcut listener
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Toggle visibility with Alt+H
            if (e.altKey && e.key === 'h') {
                setIsOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, []);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleToggle();
        }
    };

    const handlePresentationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setActivePresentation(e.target.value);
    };

    const toggleDiff = (id: string) => {
        setExpandedDiffs(prev => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    // Extract a single presentation from the state object
    const extractPresentation = (stateObj: any) => {
        if (!stateObj) return null;

        // If it follows the new format with presentations array
        if (stateObj.presentations && Array.isArray(stateObj.presentations) && stateObj.presentations.length > 0) {
            return stateObj.presentations[0];
        }

        // For legacy format or if stateObj is already a presentation
        return stateObj;
    };

    // Format the diff result for display
    const formatDiff = (diffResult: any, parentPath: string[] = []): DiffItem[] => {
        if (!diffResult || typeof diffResult !== 'object') return [];

        return Object.entries(diffResult).flatMap(([key, value]: [string, any]) => {
            const currentPath = [...parentPath, key];

            if (value === null || typeof value !== 'object') {
                return [];
            }

            if ('onlyInObj1' in value) {
                return [
                    {
                        key,
                        path: currentPath,
                        type: 'removed',
                        before: value.onlyInObj1,
                    },
                ];
            }

            if ('onlyInObj2' in value) {
                return [
                    {
                        key,
                        path: currentPath,
                        type: 'added',
                        after: value.onlyInObj2,
                    },
                ];
            }

            if ('obj1' in value && 'obj2' in value) {
                return [
                    {
                        key,
                        path: currentPath,
                        type: 'changed',
                        before: value.obj1,
                        after: value.obj2,
                    },
                ];
            }

            // Recursively process nested diffs
            return formatDiff(value, currentPath);
        });
    };

    if (!activePresentation) return null;

    const hasUndo = historyStore.canUndo(activePresentation);
    const hasRedo = historyStore.canRedo(activePresentation);
    const isTransactionActive = historyStore.hasActiveTransaction(activePresentation);

    // Get the history for the active presentation
    const presentationHistory = historyStore.history[activePresentation] || { past: [], future: [] };
    const historyItems = activeTab === 'past' ? presentationHistory.past : presentationHistory.future;

    const renderDiff = (item: HistoryAction) => {
        // Extract the actual presentation objects from the before/after states
        const beforePresentation = extractPresentation(item.before);
        const afterPresentation = extractPresentation(item.after);

        // Calculate the diff
        const diff = deepDiff(beforePresentation, afterPresentation);
        const formattedDiff = formatDiff(diff);

        if (!formattedDiff.length) {
            return <div className={styles.emptyMessage}>No differences found</div>;
        }

        // Format JSON with indentation for better readability
        const formatJSON = (value: any): string => {
            if (value === undefined) return 'undefined';
            if (value === null) return 'null';

            try {
                // For objects and arrays, format with indentation
                if (typeof value === 'object') {
                    return JSON.stringify(value, null, 2);
                }
                // For primitive values, return as is
                return String(value);
            } catch {
                return String(value);
            }
        };

        // Limit string length to prevent UI overflow
        const limitString = (str: string, maxLength = 300): string => {
            if (str.length <= maxLength) return str;
            return str.substring(0, maxLength) + '...';
        };

        return (
            <div className={styles.diffContainer}>
                {formattedDiff.map((diffItem, i) => (
                    <div key={i} className={styles.diffGroup}>
                        <div className={styles.diffPath}>{diffItem.path.join('.')}</div>
                        {diffItem.type === 'removed' && (
                            <span className={`${styles.diffLine} ${styles.diffRemoved}`}>
                                - {limitString(formatJSON(diffItem.before))}
                            </span>
                        )}
                        {diffItem.type === 'added' && (
                            <span className={`${styles.diffLine} ${styles.diffAdded}`}>
                                + {limitString(formatJSON(diffItem.after))}
                            </span>
                        )}
                        {diffItem.type === 'changed' && (
                            <>
                                <span className={`${styles.diffLine} ${styles.diffRemoved}`}>
                                    - {limitString(formatJSON(diffItem.before))}
                                </span>
                                <span className={`${styles.diffLine} ${styles.diffAdded}`}>
                                    + {limitString(formatJSON(diffItem.after))}
                                </span>
                            </>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderHistoryItem = (item: HistoryAction, index: number) => {
        const itemId = `${item.presentationId}-${item.timestamp}`;
        const isDiffExpanded = expandedDiffs[itemId] || false;

        return (
            <div key={index} className={styles.historyItem}>
                <div className={styles.historyItemHeader}>
                    <span className={styles.historyItemTitle}>{item.description}</span>
                    <span className={styles.historyItemTime}>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className={styles.historyItemDetails}>
                    <div className={styles.detailLabel}>Type:</div>
                    <div>{item.type}</div>

                    {item.slideId && (
                        <>
                            <div className={styles.detailLabel}>Slide:</div>
                            <div>{item.slideId}</div>
                        </>
                    )}

                    {item.elementId && (
                        <>
                            <div className={styles.detailLabel}>Element:</div>
                            <div>{item.elementId}</div>
                        </>
                    )}

                    {item.layoutId && (
                        <>
                            <div className={styles.detailLabel}>Layout:</div>
                            <div>{item.layoutId}</div>
                        </>
                    )}

                    {item.transactionId && (
                        <>
                            <div className={styles.detailLabel}>Transaction:</div>
                            <div>{item.transactionId.substring(0, 8)}...</div>
                        </>
                    )}
                </div>

                <button
                    className={styles.diffButton}
                    onClick={() => toggleDiff(itemId)}
                    aria-label={isDiffExpanded ? 'Hide diff' : 'Show diff'}
                >
                    {isDiffExpanded ? 'Hide Diff' : 'Show Diff'}
                </button>

                {isDiffExpanded && renderDiff(item)}
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <button
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                className={styles.toggleButton}
                aria-label="Toggle history debug popup"
                tabIndex={0}
            >
                <FaHistory />
            </button>

            {isOpen && (
                <div className={styles.popupContainer}>
                    <h3 className={styles.popupTitle}>History Debug</h3>

                    {presentations.length > 1 && (
                        <div className={styles.presentationSelector}>
                            <label htmlFor="presentation-select" className={styles.selectorLabel}>
                                Presentation:
                            </label>
                            <select
                                id="presentation-select"
                                className={styles.selectDropdown}
                                value={activePresentation}
                                onChange={handlePresentationChange}
                            >
                                {presentations.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.title || `Presentation ${p.id.substring(0, 6)}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={styles.statusContainer}>
                        <div
                            className={`${styles.statusBadge} ${hasUndo ? styles.statusBadgeGreen : styles.statusBadgeRed}`}
                        >
                            Can Undo: {hasUndo ? 'Yes' : 'No'} ({presentationHistory.past.length})
                        </div>
                        <div
                            className={`${styles.statusBadge} ${hasRedo ? styles.statusBadgeGreen : styles.statusBadgeRed}`}
                        >
                            Can Redo: {hasRedo ? 'Yes' : 'No'} ({presentationHistory.future.length})
                        </div>
                        <div
                            className={`${styles.statusBadge} ${isTransactionActive ? styles.statusBadgeYellow : styles.statusBadgeGray}`}
                        >
                            Transaction: {isTransactionActive ? 'Active' : 'None'}
                        </div>
                    </div>

                    <div className={styles.tabContainer}>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`${styles.tabButton} ${activeTab === 'past' ? styles.tabButtonActive : styles.tabButtonInactive}`}
                            aria-label="Show undo history"
                        >
                            Undo Stack
                        </button>
                        <button
                            onClick={() => setActiveTab('future')}
                            className={`${styles.tabButton} ${activeTab === 'future' ? styles.tabButtonActive : styles.tabButtonInactive}`}
                            aria-label="Show redo history"
                        >
                            Redo Stack
                        </button>
                    </div>

                    <div className={styles.historySection}>
                        <h4 className={styles.sectionTitle}>
                            {activeTab === 'past' ? 'Undo' : 'Redo'} Stack ({historyItems.length} items):
                        </h4>
                        <div className={styles.historyList}>
                            {historyItems.length === 0 ? (
                                <div className={styles.emptyMessage}>No history items</div>
                            ) : (
                                historyItems.map(renderHistoryItem)
                            )}
                        </div>
                    </div>

                    <div className={styles.footerText}>Presentation ID: {activePresentation}</div>
                </div>
            )}
        </div>
    );
};

export default HistoryDebugPopup;
