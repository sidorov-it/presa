import { Theme } from '@/types/theme';
import { ThemeTypography } from '@/types/theme';
import { Span } from '@chakra-ui/react';
import { Accordion } from '@chakra-ui/react';
import { CiLineHeight } from 'react-icons/ci';
import { CgSpaceBetween } from 'react-icons/cg';
import { FONT_WEIGHTS } from '@/constants/consts';
import { FONT_OPTIONS } from '@/utils/fontLoader';

import { Label } from '../../../ui/Label';
import { Select } from '../../../ui/Select';
import { Input } from '@/components/ui/Input/Input';

import styles from './Fonts.module.css';

export default function Fonts({
    theme,
    handleTypographyChange,
}: {
    theme: Theme;
    handleTypographyChange: (typography: Partial<ThemeTypography>) => void;
}) {
    return (
        <div style={{ width: '100%' }}>
            <div>
                <h3 className={styles.sectionTitle}>Шрифты</h3>

                <h4 className={styles.sectionSubtitle}>Заголовок</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <Label>Шрифт</Label>
                        <Select
                            options={FONT_OPTIONS}
                            value={[theme.typography.headingFont]}
                            onValueChange={({ value }: { value: string[] }) =>
                                handleTypographyChange({ headingFont: value[0] })
                            }
                        />
                    </div>
                    <div>
                        <Label>Толщина</Label>
                        <Select
                            options={FONT_WEIGHTS.map(weight => ({
                                value: String(weight.value),
                                label: weight.label,
                            }))}
                            value={[String(theme.typography.headingWeight)]}
                            onValueChange={({ value }: { value: string[] }) =>
                                handleTypographyChange({
                                    headingWeight: parseInt(value[0]),
                                })
                            }
                        />
                    </div>

                    <Accordion.Root collapsible className={styles.accordion}>
                        <Accordion.Item key={'a'} value={'a'} className={styles.accordionItem}>
                            <Accordion.ItemTrigger className={styles.accordionItemTrigger}>
                                <Span flex="1">Дополнительно</Span>
                                <Accordion.ItemIndicator />
                            </Accordion.ItemTrigger>
                            <Accordion.ItemContent>
                                <Accordion.ItemBody>
                                    <div className={styles.accordionContent}>
                                        <div style={{ flex: '1' }}>
                                            <Label>Высота строки</Label>
                                            <Input
                                                type="number"
                                                value={theme.typography.headingLineHeight}
                                                step={0.1}
                                                min={1}
                                                max={2}
                                                leftElement={<CiLineHeight />}
                                                onChange={e =>
                                                    handleTypographyChange({
                                                        headingLineHeight: parseFloat(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                        <div style={{ flex: '1' }}>
                                            <Label>Интервал между буквами</Label>
                                            <Input
                                                type="number"
                                                variant="filled"
                                                value={theme.typography.headingLetterSpacing}
                                                step={1}
                                                min={-10}
                                                max={10}
                                                leftElement={<CgSpaceBetween />}
                                                onChange={e =>
                                                    handleTypographyChange({
                                                        headingLetterSpacing: parseFloat(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </Accordion.ItemBody>
                            </Accordion.ItemContent>
                        </Accordion.Item>
                    </Accordion.Root>
                </div>
            </div>

            <div>
                <h4 className={styles.sectionSubtitle}>Основной текст</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <Label>Шрифт</Label>
                        <Select
                            options={FONT_OPTIONS}
                            value={[theme.typography.bodyFont]}
                            onValueChange={({ value }: { value: string[] }) =>
                                handleTypographyChange({ bodyFont: value[0] })
                            }
                        />
                    </div>
                    <div>
                        <Label>Толщина</Label>
                        <Select
                            options={FONT_WEIGHTS.map(weight => ({
                                value: String(weight.value),
                                label: weight.label,
                            }))}
                            value={[String(theme.typography.bodyWeight)]}
                            onValueChange={({ value }: { value: string[] }) =>
                                handleTypographyChange({
                                    bodyWeight: parseInt(value[0]),
                                })
                            }
                        />
                    </div>
                    <Accordion.Root collapsible className={styles.accordion}>
                        <Accordion.Item key={'a'} value={'a'} className={styles.accordionItem}>
                            <Accordion.ItemTrigger className={styles.accordionItemTrigger}>
                                <Span flex="1">Дополнительно</Span>
                                <Accordion.ItemIndicator />
                            </Accordion.ItemTrigger>
                            <Accordion.ItemContent>
                                <Accordion.ItemBody>
                                    <div className={styles.accordionContent}>
                                        <div style={{ flex: '1' }}>
                                            <Label>Высота строки</Label>
                                            <Input
                                                type="number"
                                                value={theme.typography.bodyLineHeight}
                                                step={0.1}
                                                min={1}
                                                max={2}
                                                leftElement={<CiLineHeight />}
                                                onChange={e =>
                                                    handleTypographyChange({
                                                        bodyLineHeight: parseFloat(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                        <div style={{ flex: '1' }}>
                                            <Label>Интервал между буквами</Label>
                                            <Input
                                                type="number"
                                                variant="filled"
                                                value={theme.typography.bodyLetterSpacing}
                                                step={1}
                                                min={-10}
                                                max={10}
                                                leftElement={<CgSpaceBetween />}
                                                onChange={e =>
                                                    handleTypographyChange({
                                                        bodyLetterSpacing: parseFloat(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </Accordion.ItemBody>
                            </Accordion.ItemContent>
                        </Accordion.Item>
                    </Accordion.Root>
                </div>
            </div>
        </div>
    );
}
