import type { ReactNode } from 'react';
import EditorFooter from './EditorFooter';

export default function DocsEditorLayout({ children }: { children: ReactNode }) {
    return (
        <>
            {children}
            <EditorFooter />
        </>
    );
}
