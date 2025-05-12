'use client';
import { ColorModeProvider } from './color-mode';
import type { ReactNode } from 'react';
import { ChakraProvider } from '../providers/ChakraProvider';

interface ProviderProps {
    children: ReactNode;
}

export function Provider({ children }: ProviderProps) {
    return (
        <ChakraProvider>
            <ColorModeProvider>{children}</ColorModeProvider>
        </ChakraProvider>
    );
}
