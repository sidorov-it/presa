import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Slider } from '@/components/ui/Slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Theme, ThemeColors, ThemeTypography, ThemeDesign } from '@/types/theme';
import { ColorPicker } from '@/components/ui/ColorPicker/ColorPicker';

interface ThemeEditorProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const ThemeEditor = ({ theme, onThemeChange }: ThemeEditorProps) => {
    const handleColorsChange = (colors: Partial<ThemeColors>) => {
        onThemeChange({
            ...theme,
            colors: { ...theme.colors, ...colors },
        });
    };

    const handleTypographyChange = (typography: Partial<ThemeTypography>) => {
        onThemeChange({
            ...theme,
            typography: { ...theme.typography, ...typography },
        });
    };

    const handleDesignChange = (design: Partial<ThemeDesign>) => {
        onThemeChange({
            ...theme,
            design: { ...theme.design, ...design },
        });
    };

    return (
        <div className="w-full">
            <Tabs defaultValue="colors" className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-4">
                    <TabsTrigger value="colors">Цвета</TabsTrigger>
                    <TabsTrigger value="typography">Шрифты</TabsTrigger>
                    <TabsTrigger value="design">Дизайн</TabsTrigger>
                </TabsList>

                <TabsContent value="colors">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Основной акцент</Label>
                            <ColorPicker
                                value={theme.colors.primaryAccent}
                                onChange={(value) => handleColorsChange({ primaryAccent: value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Цвет заголовков</Label>
                            <ColorPicker
                                value={theme.colors.headingColor}
                                onChange={(value) => handleColorsChange({ headingColor: value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Цвет текста</Label>
                            <ColorPicker
                                value={theme.colors.textColor}
                                onChange={(value) => handleColorsChange({ textColor: value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Фон слайда</Label>
                            <ColorPicker
                                value={theme.colors.slideBackground}
                                onChange={(value) => handleColorsChange({ slideBackground: value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Фон страницы</Label>
                            <ColorPicker
                                value={theme.colors.pageBackground}
                                onChange={(value) => handleColorsChange({ pageBackground: value })}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="typography">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Шрифт заголовков</Label>
                            <Select
                                value={theme.typography.headingFont}
                                onValueChange={(value) => handleTypographyChange({ headingFont: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select font" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="inter">Inter</SelectItem>
                                    <SelectItem value="roboto">Roboto</SelectItem>
                                    <SelectItem value="raleway">Raleway</SelectItem>
                                    <SelectItem value="open-sans">Open Sans</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Толщина заголовков: {theme.typography.headingWeight}</Label>
                            <Slider
                                value={[theme.typography.headingWeight]}
                                onValueChange={([value]) => handleTypographyChange({ headingWeight: value })}
                                min={100}
                                max={900}
                                step={100}
                                className="py-2"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Шрифт текста</Label>
                            <Select
                                value={theme.typography.bodyFont}
                                onValueChange={(value) => handleTypographyChange({ bodyFont: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select font" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="inter">Inter</SelectItem>
                                    <SelectItem value="roboto">Roboto</SelectItem>
                                    <SelectItem value="raleway">Raleway</SelectItem>
                                    <SelectItem value="open-sans">Open Sans</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Толщина текста: {theme.typography.bodyWeight}</Label>
                            <Slider
                                value={[theme.typography.bodyWeight]}
                                onValueChange={([value]) => handleTypographyChange({ bodyWeight: value })}
                                min={100}
                                max={900}
                                step={100}
                                className="py-2"
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="design">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Радиус границы слайда</Label>
                            <Input
                                type="text"
                                value={theme.design.slide.borderRadius}
                                onChange={(e) => handleDesignChange({
                                    slide: { ...theme.design.slide, borderRadius: e.target.value }
                                })}
                                placeholder="e.g., 8px"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Прозрачность блоков: {Math.round(theme.design.blocks.opacity * 100)}%</Label>
                            <Slider
                                value={[theme.design.blocks.opacity * 100]}
                                onValueChange={([value]) => handleDesignChange({
                                    blocks: { ...theme.design.blocks, opacity: value / 100 }
                                })}
                                min={0}
                                max={100}
                                step={1}
                                className="py-2"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Ширина границы</Label>
                            <Select
                                value={theme.design.blocks.borderWidth}
                                onValueChange={(value) => handleDesignChange({
                                    blocks: { ...theme.design.blocks, borderWidth: value as ThemeDesign['blocks']['borderWidth'] }
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select border width" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="thin">Thin</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="thick">Thick</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Форма кнопки</Label>
                            <Select
                                value={theme.design.buttons.buttonShape}
                                onValueChange={(value) => handleDesignChange({
                                    buttons: { ...theme.design.buttons, buttonShape: value as ThemeDesign['buttons']['buttonShape'] }
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select button shape" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="square">Square</SelectItem>
                                    <SelectItem value="rounded">Rounded</SelectItem>
                                    <SelectItem value="pill">Pill</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};