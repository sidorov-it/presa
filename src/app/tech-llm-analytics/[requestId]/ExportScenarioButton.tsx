'use client';

import { useState } from 'react';
import { Button } from '@chakra-ui/react';
import ExportScenarioModal from '@/components/ExportScenarioModal';

interface ExportScenarioButtonProps {
    requestId: string;
    requestCount: number;
}

export default function ExportScenarioButton({ requestId, requestCount }: ExportScenarioButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <Button colorScheme="green" size="sm" onClick={() => setIsModalOpen(true)}>
                📤 Export as MockGPT Scenario
            </Button>

            <ExportScenarioModal
                requestId={requestId}
                requestCount={requestCount}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
