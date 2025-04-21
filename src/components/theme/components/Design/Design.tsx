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
    const [selectedTab, setSelectedTab] = useState('cards');

    const items = [
        {
            label: 'Слайды',
            content: <CardsDesign theme={theme} handleDesignChange={handleDesignChange} />,
        },
        {
            label: 'Блоки и контент',
            content: <BlockDesign theme={theme} handleDesignChange={handleDesignChange} />,
        },
        {
            label: 'Кнопки и ссылки',
            content: <CardsDesign theme={theme} handleDesignChange={handleDesignChange} />,
        },
    ];

    return (
        <div style={{ marginTop: '16px' }}>
            <div>
                <h3 className={styles.sectionTitle}>Дизайн слайда</h3>
                <div style={{ fontSize: '0.875rem', lineHeight: '1.25rem', color: '#6B7280' }}>
                    Более точное управление конкретными элементами в вашей теме.
                </div>

                <ChakraTabs.Root
                    variant={'plain'}
                    size={'md'}
                    colorScheme={'blue'}
                    // defaultIndex={0}
                    // index={index}
                    value={selectedTab}
                    onValueChange={e => setSelectedTab(e.value)}
                    // {...props}
                >
                    <ChakraTabs.List className={styles.tabs}>
                        {items.map((item: { label: string; content: React.ReactNode }, idx: number) => (
                            <ChakraTabs.Trigger
                                key={idx}
                                value={item.label}
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
