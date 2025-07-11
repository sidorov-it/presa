'use client';

import React, { useState } from 'react';
import { useUIStateStore } from '../../store/uiStateStore';
import styles from './UIStateDebugButton.module.css';

const UIStateDebugButton: React.FC = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const uiState = useUIStateStore();

    const handleTogglePopup = () => {
        setIsPopupOpen(!isPopupOpen);
    };

    const handleClosePopup = () => {
        setIsPopupOpen(false);
    };

    return (
        <>
            <button
                className={styles.debugButton}
                onClick={handleTogglePopup}
                title="UI State Debug"
                aria-label="Open UI State Debug Popup"
            >
                🐛
            </button>

            {isPopupOpen && (
                <div className={styles.popupOverlay}>
                    <div className={styles.popup}>
                        <div className={styles.popupHeader}>
                            <h3>UI State Debug</h3>
                            <button className={styles.closeButton} onClick={handleClosePopup} aria-label="Close popup">
                                ×
                            </button>
                        </div>
                        <div className={styles.popupContent}>
                            <div className={styles.section}>
                                <h4>Selection State</h4>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>selectedSlideId:</span>
                                    <span className={styles.value}>{uiState.selectedSlideId || 'null'}</span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>selectedElementId:</span>
                                    <span className={styles.value}>{uiState.selectedElementId || 'null'}</span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>selectedLayoutId:</span>
                                    <span className={styles.value}>{uiState.selectedLayoutId || 'null'}</span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>selectedCellId:</span>
                                    <span className={styles.value}>{uiState.selectedCellId || 'null'}</span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>selectedSmartLayoutItemId:</span>
                                    <span className={styles.value}>{uiState.selectedSmartLayoutItemId || 'null'}</span>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h4>Table State</h4>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>selectedRowIndex:</span>
                                    <span className={styles.value}>{uiState.selectedRowIndex ?? 'null'}</span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>selectedColumnIndex:</span>
                                    <span className={styles.value}>{uiState.selectedColumnIndex ?? 'null'}</span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>hoveredTableId:</span>
                                    <span className={styles.value}>{uiState.hoveredTableId || 'null'}</span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>hoveredRowIndex:</span>
                                    <span className={styles.value}>{uiState.hoveredRowIndex ?? 'null'}</span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>hoveredColumnIndex:</span>
                                    <span className={styles.value}>{uiState.hoveredColumnIndex ?? 'null'}</span>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h4>Context Menu State</h4>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>isContextMenuOpen:</span>
                                    <span className={styles.value}>{uiState.isContextMenuOpen ? 'true' : 'false'}</span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>contextMenuElementType:</span>
                                    <span className={styles.value}>{uiState.contextMenuElementType || 'null'}</span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>contextMenuTableRowIndex:</span>
                                    <span className={styles.value}>{uiState.contextMenuTableRowIndex ?? 'null'}</span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>contextMenuTableColumnIndex:</span>
                                    <span className={styles.value}>
                                        {uiState.contextMenuTableColumnIndex ?? 'null'}
                                    </span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>contextMenuTableId:</span>
                                    <span className={styles.value}>{uiState.contextMenuTableId || 'null'}</span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>contextMenuColumnIndex:</span>
                                    <span className={styles.value}>{uiState.contextMenuColumnIndex ?? 'null'}</span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>contextMenuSmartLayoutItemId:</span>
                                    <span className={styles.value}>
                                        {uiState.contextMenuSmartLayoutItemId || 'null'}
                                    </span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>isContextMenuOnTextEditor:</span>
                                    <span className={styles.value}>
                                        {uiState.isContextMenuOnTextEditor ? 'true' : 'false'}
                                    </span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>isContextMenuInTable:</span>
                                    <span className={styles.value}>
                                        {uiState.isContextMenuInTable ? 'true' : 'false'}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h4>Side Menu State</h4>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>sideMenuState.isOpen:</span>
                                    <span className={styles.value}>
                                        {uiState.sideMenuState.isOpen ? 'true' : 'false'}
                                    </span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>sideMenuState.sideMenuId:</span>
                                    <span className={styles.value}>{uiState.sideMenuState.sideMenuId || 'null'}</span>
                                </div>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>sideMenuState.sideMenuData:</span>
                                    <span className={styles.value}>
                                        {uiState.sideMenuState.sideMenuData
                                            ? JSON.stringify(uiState.sideMenuState.sideMenuData, null, 2)
                                            : 'null'}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h4>Presentation Context</h4>
                                <div className={styles.stateItem}>
                                    <span className={styles.label}>currentPresentationId:</span>
                                    <span className={styles.value}>{uiState.currentPresentationId || 'null'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UIStateDebugButton;
