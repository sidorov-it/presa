import { Theme, ThemeColors, ThemeTypography, ThemeDesign } from '@/types/theme';
import { Tabs as ChakraTabs } from '@chakra-ui/react';
import Colors from './components/Colors';
import Fonts from './components/Fonts';
import Design from './components/Design';
import { useState } from 'react';
import styles from './ThemeEditor.module.css';
import { BiSolidColorFill } from 'react-icons/bi';
import { FaFont } from 'react-icons/fa';
import { MdOutlineDesignServices } from 'react-icons/md';

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

    const items = [
        {
            label: 'Цвета',
            icon: <BiSolidColorFill />,
            content: <Colors theme={theme} handleColorsChange={handleColorsChange} />,
        },
        {
            label: 'Шрифты',
            icon: <FaFont />,
            content: <Fonts theme={theme} handleTypographyChange={handleTypographyChange} />,
        },
        {
            label: 'Дизайн',
            icon: <MdOutlineDesignServices />,
            content: <Design theme={theme} handleDesignChange={handleDesignChange} />,
        },
    ];

    const [selectedTab, setSelectedTab] = useState(items[0].label);

    return (
        <div
            style={{
                width: '100%',
            }}
        >
            <ChakraTabs.Root
                variant={'plain'}
                size={'md'}
                colorScheme={'blue'}
                orientation="vertical"
                // defaultIndex={0}
                // index={index}
                value={selectedTab}
                onValueChange={e => setSelectedTab(e.value)}
                // {...props}
            >
                <ChakraTabs.List className={styles.tabs}>
                    {items.map(
                        (item: { label: string; content: React.ReactNode; icon: React.ReactNode }, idx: number) => (
                            <ChakraTabs.Trigger
                                key={idx}
                                value={item.label}
                                className={`${styles.tab} ${selectedTab === item.label ? styles.selectedTab : ''}`}
                            >
                                {item.icon}
                                {item.label}
                            </ChakraTabs.Trigger>
                        )
                    )}
                </ChakraTabs.List>
                {items.map((item: { label: string; content: React.ReactNode }, idx: number) => (
                    <ChakraTabs.Content value={item.label} key={idx} className={styles.tabContent}>
                        <div>{item.content}</div>
                    </ChakraTabs.Content>
                ))}
            </ChakraTabs.Root>
        </div>
    );
};
