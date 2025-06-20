import React, { useState } from 'react';

interface SimplePdfExportButtonProps {
    presentationId: string;
    presentationTitle?: string;
    className?: string;
}

const SimplePdfExportButton: React.FC<SimplePdfExportButtonProps> = ({
    presentationId,
    presentationTitle = 'presentation',
    className = '',
}) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportToPdf = async () => {
        if (!presentationId) {
            alert('Presentation ID is required');
            return;
        }

        setIsExporting(true);

        try {
            const response = await fetch(`/api/presentations/${presentationId}/export/pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to export PDF');
            }

            const pdfBlob = await response.blob();
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${presentationTitle}.pdf`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            alert('PDF exported successfully');

        } catch (error) {
            console.error('PDF export error:', error);
            alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExportToPdf}
            disabled={isExporting}
            className={`pdf-export-btn ${className}`}
            type="button"
            style={{
                padding: '8px 16px',
                backgroundColor: isExporting ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isExporting ? 'not-allowed' : 'pointer',
            }}
        >
            {isExporting ? 'Exporting...' : 'Export PDF'}
        </button>
    );
};

export default SimplePdfExportButton; 