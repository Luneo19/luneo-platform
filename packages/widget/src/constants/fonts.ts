export const AVAILABLE_FONTS = [
  'Inter',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Playfair Display',
] as const;

export type FontFamily = typeof AVAILABLE_FONTS[number];



