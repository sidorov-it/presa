/* eslint-disable prettier/prettier */
'use client';
import React, { useState, useEffect } from 'react';
import { ChartElement } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';

import { FaChartBar } from 'react-icons/fa6';
import { FaChartColumn } from 'react-icons/fa6';
import { FaChartLine, FaChartPie } from 'react-icons/fa';
import { PiChartDonutFill } from 'react-icons/pi';

import styles from './ChartSettings.module.css';

const lightThemeVars: React.CSSProperties = {
    '--color-surface': '#F7FAFC',
    '--color-border': '#E2E8F0',
    '--color-text': '#1A202C',
    '--color-text-light': '#718096',
    '--color-background': '#FFFFFF',
    '--color-primary': '#007BFF',
    '--color-primary-dark': '#0066CC',
    '--color-button-text': '#fff',
    '--color-error': '#FF4444',
};
interface ChartSettingsProps {
    elementId: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    onUpdate?: (updates: Partial<ChartElement>) => void;
}

const ChartSettings: React.FC<ChartSettingsProps> = ({ elementId, presentationId, slideId, layoutId, onUpdate }) => {
    const element = usePresentationStore(
        state => state.getElement(presentationId, slideId, layoutId, elementId) as ChartElement
    );

    const updateElement = usePresentationStore(state => state.updateElement);
    // Initial state for table data with default rows and series
    const [tableData, setTableData] = useState<Array<{ [key: string]: string | number }>>([
        { name: 'Q1', 'Sales (Millions)': 220, Clients: 133 },
        { name: 'Q2', 'Sales (Millions)': 458, Clients: 123 },
        { name: 'Q3', 'Sales (Millions)': 359, Clients: 222 },
        { name: 'Q4', 'Sales (Millions)': 500, Clients: 135 },
    ]);

    const [series, setSeries] = useState<Array<{ key: string; label: string }>>([
        { key: 'Sales (Millions)', label: 'Sales (Millions)' },
        { key: 'Clients', label: 'Clients' },
    ]);

    useEffect(() => {
        if (element?.data) {
            setTableData(element.data);
            if (element.series) {
                setSeries(element.series);
            } else {
                // Extract series from data if not explicitly defined
                const firstRow = element.data[0];
                if (firstRow) {
                    const newSeries = Object.keys(firstRow)
                        .filter(key => key !== 'name')
                        .map(key => ({ key, label: key }));
                    setSeries(newSeries);
                }
            }
        }
    }, [element]);

    const handleChangeChartType = (elementVariant: 'bar' | 'line' | 'pie' | 'donut' | 'column') => {
        if (presentationId && slideId && layoutId && elementId) {
            updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: {
                    elementVariant,
                },
            });

            if (onUpdate) {
                onUpdate({ elementVariant });
            }
        }
    };

    const handleValueChange = (index: number, key: string, value: string) => {
        setTableData(prev => {
            const newData = [...prev];
            if (key === 'name') {
                newData[index] = { ...newData[index], name: value };
            } else {
                newData[index] = { ...newData[index], [key]: Number(value) || 0 };
            }
            return newData;
        });
    };

    const handleAddRow = () => {
        setTableData(prev => {
            const newRow: { [key: string]: string | number } = { name: `Item ${prev.length + 1}` };
            series.forEach(s => {
                newRow[s.key] = 0;
            });
            return [...prev, newRow];
        });
    };

    const handleAddColumn = () => {
        const timestamp = Date.now();
        const newKey = `series_${timestamp}`;
        const newLabel = `Серия ${series.length + 1}`;
        setSeries(prev => [...prev, { key: newKey, label: newLabel }]);
        setTableData(prev =>
            prev.map(row => ({
                ...row,
                [newKey]: 0,
            }))
        );
    };

    const handleDeleteRow = (index: number) => {
        setTableData(prev => prev.filter((_, i) => i !== index));
    };

    const handleDeleteColumn = (key: string) => {
        setSeries(prev => prev.filter(s => s.key !== key));
        setTableData(prev => prev.map(({ [key]: _, ...rest }) => rest));
    };

    const handleColumnLabelChange = (key: string, newLabel: string) => {
        setSeries(prev => prev.map(s => (s.key === key ? { ...s, label: newLabel } : s)));
    };

    const handleApplyData = () => {
        if (presentationId && slideId && layoutId && elementId) {
            updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: {
                    data: tableData,
                    series: series,
                },
            });

            if (onUpdate) {
                onUpdate({ data: tableData, series: series });
            }
        }
    };

    if (!element) return null;

    return (
        <div className={`${styles.chartSettings} light-theme-only`} style={lightThemeVars}>
            <div style={{ marginTop: '0.5rem' }}>
                <span className={styles.label}>Тип диаграммы</span>
                <div className={styles.buttons}>
                    <button
                        type="button"
                        className={`${styles.button} ${element.elementVariant === 'bar' ? styles.buttonActive : ''}`}
                        onClick={() => handleChangeChartType('bar')}
                        aria-label="Гистограмма"
                        tabIndex={0}
                    >
                        <FaChartBar className={styles.icon} />
                    </button>

                    <button
                        type="button"
                        className={`${styles.button} ${element.elementVariant === 'column' ? styles.buttonActive : ''}`}
                        onClick={() => handleChangeChartType('column')}
                        aria-label="Столбчатая диаграмма"
                        tabIndex={0}
                    >
                        <FaChartColumn className={styles.icon} />
                    </button>

                    <button
                        type="button"
                        className={`${styles.button} ${element.elementVariant === 'line' ? styles.buttonActive : ''}`}
                        onClick={() => handleChangeChartType('line')}
                        aria-label="Линейная диаграмма"
                        tabIndex={0}
                    >
                        <FaChartLine className={styles.icon} />
                    </button>
                    <button
                        type="button"
                        className={`${styles.button} ${element.elementVariant === 'pie' ? styles.buttonActive : ''}`}
                        onClick={() => handleChangeChartType('pie')}
                        aria-label="Круговая диаграмма"
                        tabIndex={0}
                    >
                        <FaChartPie className={styles.icon} />
                    </button>
                    <button
                        type="button"
                        className={`${styles.button} ${element.elementVariant === 'donut' ? styles.buttonActive : ''}`}
                        onClick={() => handleChangeChartType('donut')}
                        aria-label="Кольцевая диаграмма"
                        tabIndex={0}
                    >
                        <PiChartDonutFill className={styles.icon} />
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
                <div className={styles.data}>
                    <span className={styles.dataLabel}>Данные</span>
                    <div style={{ marginLeft: '0.5rem' }}>
                        <button type="button" className={styles.buttonData} onClick={handleAddColumn}>
                            Добавить столбец
                        </button>
                        <button type="button" className={styles.buttonData} onClick={handleAddRow}>
                            Добавить строку
                        </button>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <colgroup>
                            <col style={{ width: '200px' }} />
                            {series.map(s => (
                                <col key={s.key} style={{ width: '200px' }} />
                            ))}
                            <col style={{ width: '100px' }} />
                        </colgroup>
                        <thead className={styles.tableHead}>
                            <tr>
                                <th className={styles.firstTableHeadItem}>Название</th>
                                {series.map((s, colIndex) => {
                                    const isPieOrDonut =
                                        element?.elementVariant === 'pie' || element?.elementVariant === 'donut';
                                    const isUnusedColumn = isPieOrDonut && colIndex > 0;

                                    return (
                                        <th
                                            key={s.key}
                                            className={`${styles.tableHeadItem} ${isUnusedColumn ? styles.tableHeadItemUnused : ''}`}
                                        >
                                            <div
                                                style={{ display: 'flex', marginLeft: '0.5rem', alignItems: 'center' }}
                                            >
                                                <div style={{ flex: '1 1 0%' }}>
                                                    <input
                                                        type="text"
                                                        className={`${styles.tableHeadItemInput} ${isUnusedColumn ? styles.tableHeadItemInputUnused : ''}`}
                                                        value={s.label}
                                                        onChange={e => handleColumnLabelChange(s.key, e.target.value)}
                                                        disabled={isUnusedColumn}
                                                    />
                                                </div>
                                                {series.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className={styles.tableHeadItemDeleteButton}
                                                        onClick={() => handleDeleteColumn(s.key)}
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                                <th className={styles.lastTableHeadItem}>
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className={styles.tableBody}>
                            {tableData.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td className={styles.tableBodyItem}>
                                        <input
                                            type="text"
                                            className={styles.tableBodyItemInput}
                                            value={row.name}
                                            onChange={e => handleValueChange(rowIndex, 'name', e.target.value)}
                                        />
                                    </td>
                                    {series.map((s, colIndex) => {
                                        const isPieOrDonut =
                                            element?.elementVariant === 'pie' || element?.elementVariant === 'donut';
                                        const isUnusedColumn = isPieOrDonut && colIndex > 0;

                                        return (
                                            <td
                                                key={s.key}
                                                style={{
                                                    paddingLeft: '0.75rem',
                                                    paddingRight: '0.75rem',
                                                    paddingTop: '1rem',
                                                    paddingBottom: '1rem',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                <input
                                                    type="number"
                                                    className={`${styles.tableBodyItemInput} ${isUnusedColumn ? styles.tableHeadItemInputUnused : ''}`}
                                                    value={row[s.key]}
                                                    onChange={e => handleValueChange(rowIndex, s.key, e.target.value)}
                                                    disabled={isUnusedColumn}
                                                />
                                            </td>
                                        );
                                    })}
                                    <td className={styles.tableBodyItemDeleteButtonTd}>
                                        <button
                                            type="button"
                                            className={styles.tableBodyItemDeleteButton}
                                            onClick={() => handleDeleteRow(rowIndex)}
                                            disabled={tableData.length <= 1}
                                        >
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={styles.applyButtonContainer}>
                <button type="button" className={styles.applyButton} onClick={handleApplyData}>
                    Применить изменения
                </button>
            </div>
        </div>
    );
};

export default ChartSettings;
