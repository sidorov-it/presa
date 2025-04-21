import { ButtonGroup } from '@chakra-ui/react';
import { RxBorderNone } from 'react-icons/rx';
import { Button } from '@/components/ui/Button';
import Tooltip from '@/components/tooltip/Tooltip';
import { ThemeDesignBorderWidth } from '@/types/theme';

import styles from './BorderWidthSelector.module.css';

export default function BorderWidthSelector({
    borderWidth,
    onChange,
}: {
    borderWidth: ThemeDesignBorderWidth;
    onChange: (value: ThemeDesignBorderWidth) => void;
}) {
    return (
        <ButtonGroup size="sm" variant="outline" className={styles.borderButtonGroup}>
            {[
                { value: 'none', label: 'Нет' },
                { value: 'thin', label: 'Тонкая' },
                { value: 'medium', label: 'Средняя' },
                { value: 'thick', label: 'Толстая' },
            ].map(option => (
                <Tooltip
                    key={option.value}
                    content={<div>{option.label}</div>}
                    showArrow={true}
                    openDelay={500}
                    closeDelay={100}
                >
                    <Button
                        key={option.value}
                        onClick={() => onChange(option.value as ThemeDesignBorderWidth)}
                        className={`${styles.borderButton} ${borderWidth === option.value ? styles.borderActive : ''}`}
                        aria-label={`Граница ${option.label}`}
                    >
                        <p className={styles.borderContent}>
                            {option.value === 'none' && <RxBorderNone />}
                            {option.value !== 'none' && (
                                <div className={`${styles.borderBorder} ${styles[`border-${option.value}`]}`} />
                            )}
                        </p>
                    </Button>
                </Tooltip>
            ))}
        </ButtonGroup>
    );
}
