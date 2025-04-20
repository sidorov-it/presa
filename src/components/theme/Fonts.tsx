import { FONT_WEIGHTS } from '@/consts';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Theme } from '@/types/theme';
import { ThemeTypography } from '@/types/theme';

export default function Fonts({
    theme,
    handleTypographyChange,
}: {
    theme: Theme;
    handleTypographyChange: (typography: Partial<ThemeTypography>) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Заголовочный шрифт</h3>
                <div className="space-y-4">
                    <div>
                        <Label>Шрифт</Label>
                        <Select
                            options={[
                                { value: 'inter', label: 'Inter' },
                                { value: 'roboto', label: 'Roboto' },
                                { value: 'poppins', label: 'Poppins' },
                            ]}
                            value={[theme.typography.headingFont]}
                            onValueChange={({ value }: { value: string[] }) =>
                                handleTypographyChange({ headingFont: value[0] })
                            }
                        />
                    </div>
                    <div>
                        <Label>Толщина шрифта</Label>
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
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Body Font</h3>
                <div className="space-y-4">
                    <div>
                        <Label>Шрифт</Label>
                        <Select
                            options={[
                                { value: 'inter', label: 'Inter' },
                                { value: 'roboto', label: 'Roboto' },
                                { value: 'poppins', label: 'Poppins' },
                            ]}
                            value={[theme.typography.bodyFont]}
                            onValueChange={({ value }: { value: string[] }) =>
                                handleTypographyChange({ bodyFont: value[0] })
                            }
                        />
                    </div>
                    <div>
                        <Label>Толщина шрифта</Label>
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
                </div>
            </div>
        </div>
    );
}
