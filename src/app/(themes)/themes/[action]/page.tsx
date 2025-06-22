import { Suspense } from 'react';
import ThemeEditorPageContent from './ThemeEditorPageContent';

export default function ThemeEditorPage(props: { params: Promise<{ action: string }> }) {
    return (
        <Suspense>
            <ThemeEditorPageContent params={props.params} />
        </Suspense>
    );
}
