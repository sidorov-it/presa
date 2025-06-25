import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

interface PdfExportButtonProps {
    presentationId: string;
    presentationTitle?: string;
    className?: string;
}

const PdfExportButton: React.FC<PdfExportButtonProps> = ({
    presentationId,
    presentationTitle = 'presentation',
    className = '',
}) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportToPdf = async () => {
        if (!presentationId) {
            toast.error('Presentation ID is required');
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

            // Get the PDF blob from the response
            const pdfBlob = await response.blob();

            // Create a download link
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${presentationTitle}.pdf`;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({
                title: 'Success',
                description: 'PDF exported successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error('PDF export error:', error);
            toast({
                title: 'Export Failed',
                description: error instanceof Error ? error.message : 'Failed to export PDF',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button onClick={handleExportToPdf} disabled={isExporting} className={className} type="button">
            {isExporting ? 'Exporting...' : 'Export PDF'}
        </Button>
    );
};

export default PdfExportButton;
