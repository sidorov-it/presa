import React, { createContext, useContext, ReactNode } from 'react';

// Create a minimal context for essential functions
type ReadOnlyContextType = {
    isReadOnly: boolean;
};

const ReadOnlyContext = createContext<ReadOnlyContextType | undefined>(undefined);

// Provider component with minimal dependencies
export const ReadOnlyProvider: React.FC<{ children: ReactNode; isReadOnly: boolean }> = ({ children, isReadOnly }) => {
    // Provide minimal context
    const contextValue: ReadOnlyContextType = {
        isReadOnly,
    };

    return <ReadOnlyContext.Provider value={contextValue}>{children}</ReadOnlyContext.Provider>;
};

// Custom hook for using the DnD context
export const useReadOnly = () => {
    const context = useContext(ReadOnlyContext);
    if (context === undefined) {
        throw new Error('useReadOnly must be used within a ReadOnlyProvider');
    }
    return context.isReadOnly;
};
