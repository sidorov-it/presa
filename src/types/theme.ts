export type ThemeColors = {
    // Accent Colors
    primaryAccent: string;
    primaryAccentTextColor: '#000000' | '#FFFFFF';
    secondaryAccents?: string[];
    // Text Colors
    // textColor: string;

    // Background Colors
    slideBackground: string;
    pageBackground: {
        type: 'color' | 'image';
        color: string;
        imageUrl: string;
    };

    // Additional Colors
    // accentBlocksColor: string;
    // secondaryButtonColor: string;
};

export type ThemeTypography = {
    // Headings
    headingFont: string;
    headingWeight: number;
    headingColor: string;
    headingLineHeight: number;
    headingLetterSpacing: number;
    headingCapitalization: 'none' | 'uppercase';

    // Body Text
    bodyFont: string;
    bodyWeight: number;
    bodyColor: string;
    bodyLineHeight: number;
    bodyLetterSpacing: number;
    bodyCapitalization: 'none' | 'uppercase';
};

export type ThemeDesignShadow = 'none' | 'sm' | 'md';
export type ThemeDesignBorderWidth = 'none' | 'thin' | 'medium' | 'thick';
export type ThemeDesignButtonShape = 'square' | 'capsule' | 'default' | 'rounded';
export type ThemeDesignBackgroundBlockFillType = 'fill' | 'semi' | 'none';
export type ThemeDesignBlockFillColorsType = 'subtle' | 'primary' | 'custom';
export type ThemeDesignImageShape = 'default' | 'fade' | 'diagonal' | 'round' | 'round-inverse' | 'wiggle';

export type ThemeDesign = {
    // Slide Design
    slide: {
        borderRadius: string;
        shadow: ThemeDesignShadow;
        borderWidth: ThemeDesignBorderWidth;
        borderColor: string;
        opacity: number;
        imageShape: ThemeDesignImageShape | null;
    };

    // Blocks and Content
    blocks: {
        backgroundColor: string;
        backgroundBlockFillType: ThemeDesignBackgroundBlockFillType;
        borderWidth: ThemeDesignBorderWidth;
        blockFillColorsType: ThemeDesignBlockFillColorsType;
        blockBackgroundCustomColors: string[];
        shadow: ThemeDesignShadow;
    };

    // Buttons and Links
    buttons: {
        buttonColor: string;
        buttonShape: ThemeDesignButtonShape;
        linkColor: string;
    };
};

export type ThemeData = {
    name: string;
    description?: string;
    logo?: string;
    colors: ThemeColors;
    typography: ThemeTypography;
    design: ThemeDesign;
};

export type Theme = ThemeData & {
    id: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    defaultForNewPresentations: boolean;
};
