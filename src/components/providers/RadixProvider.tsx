'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

interface RadixProviderProps {
    children: React.ReactNode;
}

export function RadixProvider({ children }: RadixProviderProps) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
        </ThemeProvider>
    );
}
