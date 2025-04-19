import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Slider } from '@/components/ui/Slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Theme, ThemeColors, ThemeTypography, ThemeDesign } from '@/types/theme';
import { ColorPicker } from '@/components/ui/ColorPicker/ColorPicker';
import { Button } from '@/components/ui/Button';

interface ThemeEditorProps {
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
}

export const generateColorPalette = (accentColor: string) => {
    // Convert hex to RGB
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);

    // Convert RGB to HSL for easier manipulation
    const [h, s, l] = rgbToHsl(r, g, b);

    // --color-link
    // --color-primary-button
    // --color-card-background
    // --color-accent-blocks
    // --color-secondary-button

    const accentBlocksColor = hslToHex(h, Math.min(s * 1.5, 1), l * 0.3) + 'ff';
    const secondaryButtonColor = hslToHex(h, Math.min(s * 1.05, 1), Math.min(l * 1.03, 1)) + 'ff';
    // For shapes: Create a darker, more saturated version
    const shapesColor =
        hslToHex(
            h, // Same hue
            Math.min(s * 1.5, 1), // Increase saturation by 30%
            l * 0.3 // Reduce lightness to 30% of original
        ) + 'ff'; // Add full opacity

    // For buttons: Slightly adjust the original color
    const buttonsColor =
        hslToHex(
            h, // Same hue
            Math.min(s * 1.05, 1), // Slightly increase saturation
            Math.min(l * 1.03, 1) // Slightly increase lightness
        ) + 'ff'; // Add full opacity

    // For links: Create a slightly darker version
    const linksColor =
        hslToHex(
            h, // Same hue
            Math.min(s * 1.1, 1), // Slightly increase saturation
            l * 0.9 // Slightly reduce lightness
        ) + 'ff'; // Add full opacity

    return {
        shapesColor,
        buttonsColor,
        linksColor,
        accentBlocksColor,
        secondaryButtonColor,
    };
};

// Helper functions for color conversion
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
        s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        h /= 6;
    }

    return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
                        <div className="space-y-1">
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Основной акцент</Label>
                                    <ColorPicker
                                        value={theme.colors.primaryAccent}
                                        onChange={value => {
                                            const result = generateColorPalette(value);
                                            handleColorsChange({
                                                primaryAccent: value,
                                                accentBlocksColor: result.accentBlocksColor,
                                                // shapesColor: result.shapesColor,
                                                buttonsColor: value,
                                                linksColor: value,
                                            });
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Цвет заголовков</Label>
                                    <ColorPicker
                                        value={theme.colors.headingColor}
                                        onChange={value => handleColorsChange({ headingColor: value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Цвет текста</Label>
                                    <ColorPicker
                                        value={theme.colors.textColor}
                                        onChange={value => handleColorsChange({ textColor: value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium">Фон слайда</Label>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Цвет фона слайда</Label>
                                    <ColorPicker
                                        value={theme.colors.slideBackground}
                                        onChange={value => {
                                            const result = generateColorPalette(value);

                                            handleColorsChange({
                                                slideBackground: value,
                                                secondaryButtonColor: result.secondaryButtonColor,
                                                // shapesColor: result.shapesColor,
                                            });
                                        }}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Фон страницы</Label>
                                    <div>
                                        <Select
                                            value={theme.colors.pageBackground.type}
                                            onValueChange={value => {
                                                const newType = value as 'color' | 'image';
                                                handleColorsChange({
                                                    pageBackground: {
                                                        type: newType,
                                                        color: theme.colors.pageBackground.color,
                                                        imageUrl: theme.colors.pageBackground.imageUrl,
                                                    },
                                                });
                                            }}
                                        >
                                            <SelectTrigger className="mb-2">
                                                <SelectValue placeholder="Select background type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="color">Color</SelectItem>
                                                <SelectItem value="image">Image</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {theme.colors.pageBackground.type === 'color' ? (
                                            <ColorPicker
                                                value={theme.colors.pageBackground.color}
                                                onChange={value =>
                                                    handleColorsChange({
                                                        pageBackground: {
                                                            ...theme.colors.pageBackground,
                                                            color: value,
                                                        },
                                                    })
                                                }
                                            />
                                        ) : (
                                            <Input
                                                type="text"
                                                name="background-image"
                                                value={theme.colors.pageBackground.imageUrl}
                                                onChange={e =>
                                                    handleColorsChange({
                                                        pageBackground: {
                                                            ...theme.colors.pageBackground,
                                                            imageUrl: e.target.value,
                                                            color: '',
                                                        },
                                                    })
                                                }
                                                placeholder="Insert image URL"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="typography">
                    <div className="space-y-6">
                        {/* Заголовки */}
                        <div className="space-y-4">
                            <Label className="font-semibold">Заголовки</Label>
                            <div className="space-y-2">
                                <Label>Шрифт</Label>
                                <Select
                                    value={theme.typography.headingFont}
                                    onValueChange={v => handleTypographyChange({ headingFont: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select font" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['inter', 'roboto', 'raleway', 'open-sans'].map(f => (
                                            <SelectItem key={f} value={f}>
                                                {f}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Толщина</Label>
                                <Select
                                    value={String(theme.typography.headingWeight)}
                                    onValueChange={v => handleTypographyChange({ headingWeight: Number(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(w => (
                                            <SelectItem key={w} value={String(w)}>
                                                {w}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Цвет</Label>
                                <ColorPicker
                                    value={theme.typography.headingColor}
                                    onChange={v => handleTypographyChange({ headingColor: v })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Высота строки</Label>
                                <Input
                                    type="number"
                                    step={0.01}
                                    min={1}
                                    max={2}
                                    value={theme.typography.headingLineHeight}
                                    onChange={e => handleTypographyChange({ headingLineHeight: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Промежуток между буквами</Label>
                                <Input
                                    type="number"
                                    step={1}
                                    min={-10}
                                    max={10}
                                    value={theme.typography.headingLetterSpacing}
                                    onChange={e => handleTypographyChange({ headingLetterSpacing: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Капитализация</Label>
                                <div className="flex space-x-2">
                                    <Button
                                        variant={
                                            theme.typography.headingCapitalization === 'none' ? 'outline' : 'secondary'
                                        }
                                        onClick={() => handleTypographyChange({ headingCapitalization: 'none' })}
                                    >
                                        Aa
                                    </Button>
                                    <Button
                                        variant={
                                            theme.typography.headingCapitalization === 'uppercase'
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        onClick={() => handleTypographyChange({ headingCapitalization: 'uppercase' })}
                                    >
                                        A
                                    </Button>
                                </div>
                            </div>
                        </div>
                        {/* Текст */}
                        <div className="space-y-4">
                            <Label className="font-semibold">Текст</Label>
                            <div className="space-y-2">
                                <Label>Шрифт</Label>
                                <Select
                                    value={theme.typography.bodyFont}
                                    onValueChange={v => handleTypographyChange({ bodyFont: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select font" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['inter', 'roboto', 'raleway', 'open-sans'].map(f => (
                                            <SelectItem key={f} value={f}>
                                                {f}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Толщина</Label>
                                <Select
                                    value={String(theme.typography.bodyWeight)}
                                    onValueChange={v => handleTypographyChange({ bodyWeight: Number(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(w => (
                                            <SelectItem key={w} value={String(w)}>
                                                {w}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Цвет</Label>
                                <ColorPicker
                                    value={theme.typography.bodyColor}
                                    onChange={v => handleTypographyChange({ bodyColor: v })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Высота строки</Label>
                                <Input
                                    type="number"
                                    step={0.01}
                                    min={1}
                                    max={2}
                                    value={theme.typography.bodyLineHeight}
                                    onChange={e => handleTypographyChange({ bodyLineHeight: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Промежуток между буквами</Label>
                                <Input
                                    type="number"
                                    step={1}
                                    min={-10}
                                    max={10}
                                    value={theme.typography.bodyLetterSpacing}
                                    onChange={e => handleTypographyChange({ bodyLetterSpacing: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Капитализация</Label>
                                <div className="flex space-x-2">
                                    <Button
                                        variant={
                                            theme.typography.bodyCapitalization === 'none' ? 'outline' : 'secondary'
                                        }
                                        onClick={() => handleTypographyChange({ bodyCapitalization: 'none' })}
                                    >
                                        Aa
                                    </Button>
                                    <Button
                                        variant={
                                            theme.typography.bodyCapitalization === 'uppercase'
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        onClick={() => handleTypographyChange({ bodyCapitalization: 'uppercase' })}
                                    >
                                        A
                                    </Button>
                                </div>
                            </div>
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
                                onChange={e =>
                                    handleDesignChange({
                                        slide: { ...theme.design.slide, borderRadius: e.target.value },
                                    })
                                }
                                placeholder="e.g., 8px"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Прозрачность блоков: {Math.round(theme.design.blocks.opacity * 100)}%</Label>
                            <Slider
                                value={[theme.design.blocks.opacity * 100]}
                                onValueChange={([value]) =>
                                    handleDesignChange({
                                        blocks: { ...theme.design.blocks, opacity: value / 100 },
                                    })
                                }
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
                                onValueChange={value =>
                                    handleDesignChange({
                                        blocks: {
                                            ...theme.design.blocks,
                                            borderWidth: value as ThemeDesign['blocks']['borderWidth'],
                                        },
                                    })
                                }
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
                                onValueChange={value =>
                                    handleDesignChange({
                                        buttons: {
                                            ...theme.design.buttons,
                                            buttonShape: value as ThemeDesign['buttons']['buttonShape'],
                                        },
                                    })
                                }
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
