import { ThemeDesign } from '@/types/theme';
import { Theme } from '@/types/theme';
import { Label } from '../ui/Label';
import { ColorPicker } from '../ui/ColorPicker/ColorPicker';
import { Select } from '../ui/Select';

export default function Design({
    theme,
    handleDesignChange,
}: {
    theme: Theme;
    handleDesignChange: (design: Partial<ThemeDesign>) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Дизайн слайда</h3>
                <div className="space-y-4">
                    <div>
                        <Label>Радиус границы</Label>
                        {/* <Slider
                                    min={0}
                                    max={16}
                                    value={parseInt(theme.design.slide.borderRadius)}
                                    onChange={(value: number) =>
                                        handleDesignChange({
                                            slide: {
                                                ...theme.design.slide,
                                                borderRadius: `${value}px`,
                                            },
                                        })
                                    }
                                /> */}
                    </div>
                    <div>
                        <Label>Тень</Label>
                        <Select
                            options={[
                                { value: 'none', label: 'None' },
                                { value: 'sm', label: 'Small' },
                                { value: 'md', label: 'Medium' },
                                { value: 'lg', label: 'Large' },
                            ]}
                            value={[theme.design.slide.shadow]}
                            onValueChange={({ value }: { value: string[] }) =>
                                handleDesignChange({
                                    slide: { ...theme.design.slide, shadow: value[0] },
                                })
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Дизайн блоков</h3>
                <div className="space-y-4">
                    <div>
                        <Label>Цвет фона</Label>
                        <ColorPicker
                            value={theme.design.blocks.backgroundColor}
                            onChange={color =>
                                handleDesignChange({
                                    blocks: {
                                        ...theme.design.blocks,
                                        backgroundColor: color,
                                    },
                                })
                            }
                        />
                    </div>
                    <div>
                        <Label>Прозрачность</Label>
                        {/* <Slider
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    value={theme.design.blocks.opacity}
                                    onChange={(value: number) =>
                                        handleDesignChange({
                                            blocks: {
                                                ...theme.design.blocks,
                                                opacity: value,
                                            },
                                        })
                                    }
                                /> */}
                    </div>
                </div>
            </div>
        </div>
    );
}
