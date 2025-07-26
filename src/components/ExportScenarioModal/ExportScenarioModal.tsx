'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import styles from './ExportScenarioModal.module.css';

interface ExportScenarioModalProps {
    requestId: string;
    isOpen: boolean;
    onClose: () => void;
    requestCount: number;
}

export default function ExportScenarioModal({ requestId, isOpen, onClose, requestCount }: ExportScenarioModalProps) {
    const [scenarioName, setScenarioName] = useState(`Exported Scenario ${requestId.substring(0, 8)}`);
    const [scenarioDescription, setScenarioDescription] = useState(
        `Exported from ${requestCount} LLM requests on ${new Date().toLocaleDateString()}`
    );
    const [isExporting, setIsExporting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setScenarioName(`Exported Scenario ${requestId.substring(0, 8)}`);
            setScenarioDescription(`Exported from ${requestCount} LLM requests on ${new Date().toLocaleDateString()}`);
        }
    }, [isOpen, requestId, requestCount]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleDownload = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams({
                name: scenarioName,
                description: scenarioDescription,
            });

            const response = await fetch(`/api/tech-llm-analytics/${requestId}/export?${params}`);

            if (!response.ok) {
                throw new Error('Failed to export scenario');
            }

            // Get filename from response headers
            const contentDisposition = response.headers.get('content-disposition');
            const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'scenario.json';

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`Scenario exported successfully as ${filename}`);

            onClose();
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export scenario. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleSaveToProject = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/tech-llm-analytics/${requestId}/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: scenarioName,
                    description: scenarioDescription,
                    saveToFile: true,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save scenario');
            }

            toast.success(`Scenario saved successfully as ${result.filename} in project scenarios`);

            onClose();
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error(error.message || 'Failed to save scenario to project.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={handleBackdropClick}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Export MockGPT Scenario</h2>
                </div>

                <div className={styles.modalBody}>
                    <p className={styles.description}>
                        Export {requestCount} LLM requests as a MockGPT test scenario. This will create a JSON file that
                        can be used to reproduce these exact responses for testing.
                    </p>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Scenario Name *</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            value={scenarioName}
                            onChange={e => setScenarioName(e.target.value)}
                            placeholder="Enter scenario name"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Description</label>
                        <textarea
                            className={styles.formTextarea}
                            value={scenarioDescription}
                            onChange={e => setScenarioDescription(e.target.value)}
                            placeholder="Describe what this scenario tests"
                            rows={3}
                        />
                    </div>

                    <div className={styles.infoBox}>
                        <div className={styles.infoTitle}>What will be exported:</div>
                        <div className={styles.infoText}>
                            • Only successful requests with responses
                            <br />
                            • Function calls and their arguments
                            <br />
                            • Intelligent triggers (function names, template IDs, or prompt snippets)
                            <br />• Formatted for immediate use in MockGPT testing
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button className={`${styles.button} ${styles.buttonOutline}`} onClick={onClose}>
                        Cancel
                    </button>

                    <div className={styles.buttonGroup}>
                        <button
                            className={`${styles.button} ${styles.buttonSecondary}`}
                            onClick={handleSaveToProject}
                            disabled={!scenarioName.trim() || isExporting || isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save to Project'}
                        </button>
                        <button
                            className={`${styles.button} ${styles.buttonPrimary}`}
                            onClick={handleDownload}
                            disabled={!scenarioName.trim() || isExporting || isSaving}
                        >
                            {isExporting ? 'Downloading...' : 'Download JSON'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
