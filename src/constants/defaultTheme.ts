import { Theme } from '@/types/theme';

export const DEFAULT_THEME: Omit<Theme, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Default Theme',
  description: 'A clean, modern default theme',
  colors: {
    primaryAccent: '#3b82f6', // Blue
    secondaryAccents: ['#60a5fa', '#93c5fd', '#bfdbfe'],
    headingColor: '#1f2937', // Dark gray
    textColor: '#4b5563', // Medium gray
    slideBackground: '#ffffff', // White
    pageBackground: '#f3f4f6', // Light gray
  },
  typography: {
    headingFont: 'inter',
    headingWeight: 600,
    headingColor: '#1f2937', // Dark gray
    bodyFont: 'inter',
    bodyWeight: 400,
    bodyColor: '#4b5563', // Medium gray
  },
  design: {
    slide: {
      borderRadius: '8px',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      border: '1px solid',
      borderColor: '#e5e7eb', // Light gray border
      imageShape: 'rounded',
    },
    blocks: {
      backgroundColor: '#ffffff', // White
      opacity: 0.8,
      borderWidth: 'thin',
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    },
    buttons: {
      buttonColor: '#3b82f6', // Blue
      buttonShape: 'rounded',
      linkColor: '#2563eb', // Darker blue
    },
  },
};

export const createNewTheme = (themeData: Partial<Omit<Theme, 'id' | 'createdAt' | 'updatedAt'>> = {}): Theme => {
  return {
    id: crypto.randomUUID(), // Generate a valid UUID
    name: themeData.name || DEFAULT_THEME.name,
    description: themeData.description || DEFAULT_THEME.description,
    logo: themeData.logo,
    colors: {
      ...DEFAULT_THEME.colors,
      ...(themeData.colors || {}),
    },
    typography: {
      ...DEFAULT_THEME.typography,
      ...(themeData.typography || {}),
    },
    design: {
      slide: {
        ...DEFAULT_THEME.design.slide,
        ...(themeData.design?.slide || {}),
      },
      blocks: {
        ...DEFAULT_THEME.design.blocks,
        ...(themeData.design?.blocks || {}),
      },
      buttons: {
        ...DEFAULT_THEME.design.buttons,
        ...(themeData.design?.buttons || {}),
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}; 