import React, { useState } from 'react';
import { Button } from '@chakra-ui/react';
import { FaFilePdf } from 'react-icons/fa';
import { IPresentation } from '@/types';
import { exportPresentationToPdf } from '@/utils/pdfExport';

interface PdfExportButtonProps {
    presentation: IPresentation;
    filename?: string;
    buttonText?: string;
}

const PdfExportButton: React.FC<PdfExportButtonProps> = ({
    presentation,
    filename = 'presentation.pdf',
    buttonText = 'Export to PDF'
}) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (isExporting) return;

        try {
            setIsExporting(true);
            await exportPresentationToPdf(presentation, filename);
        } catch (error) {
            console.error('Error exporting presentation to PDF:', error);
            // You could implement proper error handling/notification here
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            leftIcon={<FaFilePdf />}
            onClick={handleExport}
            isLoading={isExporting}
            loadingText="Exporting..."
            colorScheme="blue"
            variant="solid"
            size="md"
        >
            {buttonText}
        </Button>
    );
};

export default PdfExportButton; 