export type ThemeColors = {
  // Accent Colors
  primaryAccent: string;
  secondaryAccents: string[];

  // Text Colors
  headingColor: string;
  textColor: string;

  // Background Colors
  slideBackground: string;
  pageBackground: string;
};

export type ThemeTypography = {
  // Headings
  headingFont: string;
  headingWeight: number;
  headingColor: string;

  // Body Text
  bodyFont: string;
  bodyWeight: number;
  bodyColor: string;
};

export type ThemeDesign = {
  // Slide Design
  slide: {
    borderRadius: string;
    shadow: string;
    border: string;
    borderColor: string;
    imageShape: 'square' | 'rounded' | 'circle';
  };

  // Blocks and Content
  blocks: {
    backgroundColor: string;
    opacity: number;
    borderWidth: 'thin' | 'medium' | 'thick' | 'none';
    shadow: string;
  };

  // Buttons and Links
  buttons: {
    buttonColor: string;
    buttonShape: 'square' | 'rounded' | 'pill';
    linkColor: string;
  };
};

export type Theme = {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  design: ThemeDesign;
  createdAt: Date;
  updatedAt: Date;
};