'use client';

import Footer from '@/components/ui/Footer';
import { useColorMode } from '@/components/ui/color-mode';

const EditorFooter = () => {
    const { colorMode } = useColorMode();

    return (
        <div className={colorMode === 'dark' ? 'dark' : undefined}>
            <Footer />
        </div>
    );
};

export default EditorFooter;
