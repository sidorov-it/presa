import React, { useState, useEffect } from 'react';
import { useDnd } from '@/contexts/DragDropContext';

const DragDropDebugInfo: React.FC = () => {
    const { state } = useDnd();
    const [isVisible, setIsVisible] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [targetElement, setTargetElement] = useState<string | null>(null);
    const [elementsDimensions, setElementsDimensions] = useState<any[]>([]);

    // Load visibility preference from localStorage on mount
    useEffect(() => {
        const savedVisibility = localStorage.getItem('dragDropDebugVisible');
        if (savedVisibility) {
            setIsVisible(savedVisibility === 'true');
        }
    }, []);

    // Track mouse position during dragging
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });

            // Get element under cursor for additional debugging
            const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
            if (elemBelow) {
                // Find relevant data attributes
                const elementNode = elemBelow.closest('[data-element-id]');
                const cellNode = elemBelow.closest('[data-cell-id]');
                const layoutNode = elemBelow.closest('[data-layout-id]');
                const slideNode = elemBelow.closest('[data-slide-id]');

                let targetInfo = '';
                if (elementNode) {
                    targetInfo += `Element: ${elementNode.getAttribute('data-element-id')} `;
                }
                if (cellNode) {
                    targetInfo += `Cell: ${cellNode.getAttribute('data-cell-id')} `;
                }
                if (layoutNode) {
                    targetInfo += `Layout: ${layoutNode.getAttribute('data-layout-id')} `;
                }
                if (slideNode) {
                    targetInfo += `Slide: ${slideNode.getAttribute('data-slide-id')}`;
                }

                setTargetElement(targetInfo || null);

                // Get nearby elements for debugging
                if (slideNode && (state.dragState === 'dragging' || isVisible)) {
                    const allElements = Array.from(slideNode.querySelectorAll('[data-element-id]'));
                    const elementsInfo = allElements.map(el => {
                        const rect = el.getBoundingClientRect();
                        const elementId = el.getAttribute('data-element-id');
                        return {
                            id: elementId,
                            top: Math.round(rect.top),
                            bottom: Math.round(rect.bottom),
                            left: Math.round(rect.left),
                            right: Math.round(rect.right),
                            height: Math.round(rect.height),
                            distanceY: Math.min(Math.abs(e.clientY - rect.top), Math.abs(e.clientY - rect.bottom)),
                        };
                    });

                    // Sort by vertical distance to mouse
                    elementsInfo.sort((a, b) => a.distanceY - b.distanceY);

                    // Keep only the 3 closest elements
                    setElementsDimensions(elementsInfo.slice(0, 3));
                }
            } else {
                setTargetElement(null);
            }
        };

        if (state.dragState === 'dragging' || isVisible) {
            window.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [state.dragState, isVisible]);

    // Save visibility preference to localStorage
    const toggleVisibility = () => {
        const newVisibility = !isVisible;
        setIsVisible(newVisibility);
        localStorage.setItem('dragDropDebugVisible', newVisibility.toString());
    };

    // If debug mode is not enabled, only show the toggle button
    if (!isVisible) {
        return (
            <button
                onClick={toggleVisibility}
                style={{
                    position: 'fixed',
                    bottom: '17px',
                    right: '60px',
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    cursor: 'pointer',
                    zIndex: 10000,
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
                }}
                title="Toggle DragDrop Debug Info"
            >
                🐞
            </button>
        );
    }

    // If debug is enabled but not dragging, show a minimized panel
    if (isVisible && state.dragState === 'idle') {
        return (
            <div
                style={{
                    position: 'fixed',
                    bottom: '17px',
                    right: '60px',
                    width: '200px',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    color: 'white',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    padding: '8px 12px',
                    zIndex: 10000,
                    borderRadius: '8px',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>DragDrop Debug (idle)</span>
                    <button
                        onClick={toggleVisibility}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '16px',
                        }}
                    >
                        ❌
                    </button>
                </div>
                <div style={{ marginTop: '8px' }}>
                    <strong>Mouse:</strong> x={mousePosition.x}, y={mousePosition.y}
                </div>
                {targetElement && (
                    <div style={{ marginTop: '4px', fontSize: '10px', opacity: 0.8, wordBreak: 'break-word' }}>
                        {targetElement}
                    </div>
                )}

                {elementsDimensions.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '10px' }}>
                        <strong>Nearest elements:</strong>
                        {elementsDimensions.map((el, i) => (
                            <div key={i} style={{ marginTop: '4px', opacity: 0.8 }}>
                                {el.id.substring(0, 10)}... (dist: {el.distanceY}px)
                                <br />
                                y: {el.top}-{el.bottom}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Full debug panel when dragging or when debug is enabled
    return (
        <div
            style={{
                position: 'fixed',
                bottom: '17px',
                right: '60px',
                width: '350px',
                maxHeight: '500px',
                overflowY: 'auto',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                color: 'white',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '12px',
                zIndex: 10000,
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(5px)',
            }}
        >
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}
            >
                <h3 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>DragDrop Debug Info</h3>
                <button
                    onClick={toggleVisibility}
                    style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '0',
                    }}
                >
                    ❌
                </button>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <strong>Drag State:</strong> {state.dragState}
            </div>

            <div style={{ marginBottom: '8px' }}>
                <strong>Mouse:</strong> x={mousePosition.x}, y={mousePosition.y}
            </div>

            {targetElement && (
                <div style={{ marginBottom: '8px', fontSize: '11px', opacity: 0.9, wordBreak: 'break-word' }}>
                    <strong>Element under cursor:</strong> {targetElement}
                </div>
            )}

            {elementsDimensions.length > 0 && (
                <div style={{ marginBottom: '8px', fontSize: '11px' }}>
                    <strong>Nearest elements:</strong>
                    <div style={{ marginTop: '4px', fontSize: '10px' }}>
                        {elementsDimensions.map((el, i) => (
                            <div
                                key={i}
                                style={{
                                    marginBottom: '4px',
                                    padding: '4px',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: '4px',
                                }}
                            >
                                <div>
                                    <strong>ID:</strong> {el.id}
                                </div>
                                <div>
                                    <strong>Pos:</strong> T:{el.top} B:{el.bottom} L:{el.left} R:{el.right}
                                </div>
                                <div>
                                    <strong>Distance:</strong> {el.distanceY}px
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '8px' }}>
                <strong>Source:</strong>
                <pre style={{ margin: '4px 0', maxWidth: '100%', overflowX: 'auto' }}>
                    {JSON.stringify(
                        {
                            elementId: state.source.elementId,
                            layoutId: state.source.layoutId,
                            cellId: state.source.cellId,
                            tableId: state.source.tableId,
                            rowIndex: state.source.rowIndex,
                            columnIndex: state.source.columnIndex,
                            smartLayoutItemId: state.source.smartLayoutItemId,
                        },
                        null,
                        2
                    )}
                </pre>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <strong>Target:</strong>
                <pre style={{ margin: '4px 0', maxWidth: '100%', overflowX: 'auto' }}>
                    {JSON.stringify(
                        {
                            elementId: state.target.elementId,
                            layoutId: state.target.layoutId,
                            cellId: state.target.cellId,
                            position: state.target.position,
                        },
                        null,
                        2
                    )}
                </pre>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <strong>Indicators:</strong>
                <pre style={{ margin: '4px 0', maxWidth: '100%', overflowX: 'auto' }}>
                    {JSON.stringify(
                        {
                            elementIndicator: state.indicators.elementIndicator,
                            elementPosition: state.indicators.elementPosition,
                            layoutIndicator: state.indicators.layoutIndicator,
                            layoutPosition: state.indicators.layoutPosition,
                            cellIndicator: state.indicators.cellIndicator,
                            cellPosition: state.indicators.cellPosition,
                            tableColumnIndicator: state.indicators.tableColumnIndicator,
                            tableColumnPosition: state.indicators.tableColumnPosition,
                            tableRowIndicator: state.indicators.tableRowIndicator,
                            tableRowPosition: state.indicators.tableRowPosition,
                        },
                        null,
                        2
                    )}
                </pre>
            </div>

            <div>
                <strong>Ready to Drop:</strong> {state.isReadyToDrop ? 'Yes' : 'No'}
            </div>
        </div>
    );
};

export default DragDropDebugInfo;
