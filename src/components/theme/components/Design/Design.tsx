import { ThemeDesign } from '@/types/theme';
import { Theme } from '@/types/theme';
import { Tabs as ChakraTabs } from '@chakra-ui/react';

import { useState } from 'react';
import CardsDesign from '../CardsDesign/CardsDesign';
import BlockDesign from '../BlockDesign/BlockDesign';

import styles from './Design.module.css';

export default function Design({
    theme,
    handleDesignChange,
}: {
    theme: Theme;
    handleDesignChange: (design: Partial<ThemeDesign>) => void;
}) {
    const [selectedTab, setSelectedTab] = useState('slides');

    const items = [
        {
            id: 'slides',
            label: 'Слайды',
            content: <CardsDesign theme={theme} handleDesignChange={handleDesignChange} />,
        },
        {
            id: 'blocks',
            label: 'Блоки',
            content: <BlockDesign theme={theme} handleDesignChange={handleDesignChange} />,
        },
        // {
        //     label: 'Links',
        //     content: <ButtonsDesign theme={theme} handleDesignChange={handleDesignChange} />,
        // },
    ];

    return (
        <div style={{ width: '100%' }}>
            <div>
                <h3 className={styles.sectionTitle}>Дизайн</h3>
                <div style={{ fontSize: '14px', lineHeight: '1.4', color: '#6B7280', marginBottom: '20px' }}>
                    Настройте конкретные элементы в вашей теме.
                </div>

                <ChakraTabs.Root
                    variant={'plain'}
                    size={'md'}
                    colorScheme={'blue'}
                    value={selectedTab}
                    onValueChange={e => setSelectedTab(e.value)}
                >
                    <ChakraTabs.List className={styles.tabs}>
                        {items.map((item: { id: string; label: string; content: React.ReactNode }, idx: number) => (
                            <ChakraTabs.Trigger
                                key={idx}
                                value={item.id}
                                className={`${styles.tab} ${selectedTab === item.label ? styles.selectedTab : ''}`}
                            >
                                {item.label}
                            </ChakraTabs.Trigger>
                        ))}
                    </ChakraTabs.List>
                    {items.map((item: { label: string; content: React.ReactNode }, idx: number) => (
                        <ChakraTabs.Content value={item.label} key={idx} className={styles.tabContent}>
                            <div>{item.content}</div>
                        </ChakraTabs.Content>
                    ))}
                </ChakraTabs.Root>
            </div>
        </div>
    );
}
