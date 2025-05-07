'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { ColorModeProvider } from './color-mode';
import { system } from '@/styles/theme';
import type { ReactNode } from 'react';

interface ProviderProps {
    children: ReactNode;
}

export function Provider({ children }: ProviderProps) {
    return (
        <ChakraProvider value={system}>
            <ColorModeProvider>
                {children}
            </ColorModeProvider>
        </ChakraProvider>
    );
}
