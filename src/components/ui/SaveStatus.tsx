import React from 'react';
import { FiCheck, FiAlertCircle } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

interface SaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
}

const SaveStatus: React.FC<SaveStatusProps> = ({ status }) => {
    if (status === 'idle') {
        return null; // Don't show anything when idle
    }

    return (
        <div className="flex items-center gap-1 text-sm">
            {status === 'saving' && (
                <>
                    <AiOutlineLoading3Quarters className="animate-spin text-blue-500" />
                    <span className="text-gray-600">Saving...</span>
                </>
            )}
            {status === 'saved' && (
                <>
                    <FiCheck className="text-green-500" />
                    <span className="text-green-600">Saved</span>
                </>
            )}
            {status === 'error' && (
                <>
                    <FiAlertCircle className="text-red-500" />
                    <span className="text-red-600">Save failed</span>
                </>
            )}
        </div>
    );
};

export default SaveStatus;