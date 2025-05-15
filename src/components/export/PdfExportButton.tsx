import React, { useState } from 'react';
import { Button, Icon } from '@chakra-ui/react';
import { FaFilePdf } from 'react-icons/fa';
import { toast } from 'sonner';
import { IPresentation } from '@/types';
import { exportPresentationToPdf } from '@/utils/pdfExport';

interface PdfExportButtonProps {
    presentation: IPresentation;
    filename?: string;
    buttonText?: string;
    loadingText?: string;
}

const PdfExportButton: React.FC<PdfExportButtonProps> = ({
    presentation,
    filename = 'presentation.pdf',
    buttonText = 'Export to PDF',
    loadingText = 'Exporting...',
}) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (isExporting) return;

        setIsExporting(true);

        toast.promise(exportPresentationToPdf(presentation, filename), {
            loading: 'Подготавливаем PDF для скачивания. Пожалуйста, не закрывайте эту страницу.',
            success: () => {
                setIsExporting(false);
                return 'Презентация успешно экспортирована в PDF';
            },
            error: err => {
                console.error('Error exporting presentation to PDF:', err);
                setIsExporting(false);
                return 'Произошла ошибка при экспорте. Попробуйте позже.';
            },
        });
    };

    return (
        <>
            <Button
                onClick={handleExport}
                loading={isExporting}
                loadingText={loadingText}
                colorScheme="blue"
                variant="solid"
                size="md"
                disabled={isExporting}
                aria-label="Export presentation to PDF"
                display="flex"
                alignItems="center"
                gap={2}
            >
                <Icon as={FaFilePdf} aria-hidden="true" />
                {buttonText}
            </Button>
            {/* <Toaster position="bottom-right" /> */}
        </>
    );
};

export default PdfExportButton;
