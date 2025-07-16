'use server';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

const ConditionalFooter: React.FC = () => {
    const pathname = usePathname();

    // Не показываем футер на страницах /view
    if (pathname?.startsWith('/view')) {
        return null;
    }
    
    return <Footer />;
};

export default ConditionalFooter; 