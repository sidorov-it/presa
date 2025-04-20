'use client';

import { ChakraProvider as ChakraUIProvider } from '@chakra-ui/react';
import { system } from '@/styles/theme';
import { Toaster } from 'sonner';

interface ChakraProviderProps {
    children: React.ReactNode;
}

export function ChakraProvider({ children }: ChakraProviderProps) {
    return (
        <ChakraUIProvider value={system}>
            {children}
            <Toaster />
        </ChakraUIProvider>
    );
}
