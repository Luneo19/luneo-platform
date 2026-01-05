/**
 * WCAG Contrast Checker
 * Vérifie que les combinaisons de couleurs respectent WCAG AA (4.5:1 pour texte normal, 3:1 pour texte large)
 */

export interface ContrastResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  passesAALarge: boolean;
  passesAAALarge: boolean;
}

/**
 * Convertit une couleur hex en RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calcule la luminance relative d'une couleur
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcule le ratio de contraste entre deux couleurs
 */
export function getContrastRatio(
  color1: string,
  color2: string
): number | null {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return null;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Vérifie si un ratio de contraste respecte les standards WCAG
 */
export function checkContrast(
  foreground: string,
  background: string
): ContrastResult {
  const ratio = getContrastRatio(foreground, background);

  if (!ratio) {
    return {
      ratio: 0,
      passesAA: false,
      passesAAA: false,
      passesAALarge: false,
      passesAAALarge: false,
    };
  }

  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= 4.5, // WCAG AA pour texte normal
    passesAAA: ratio >= 7, // WCAG AAA pour texte normal
    passesAALarge: ratio >= 3, // WCAG AA pour texte large (18pt+ ou 14pt+ bold)
    passesAAALarge: ratio >= 4.5, // WCAG AAA pour texte large
  };
}

/**
 * Combinaisons de couleurs critiques à vérifier
 */
export const CRITICAL_COLOR_PAIRS = [
  // Brand colors
  { fg: '#3751ff', bg: '#ffffff', name: 'Primary on White' },
  { fg: '#3751ff', bg: '#f8fafc', name: 'Primary on Neutral-50' },
  { fg: '#ffffff', bg: '#3751ff', name: 'White on Primary' },
  { fg: '#312e81', bg: '#ffffff', name: 'Primary-600 on White' },
  
  // Text colors
  { fg: '#0f172a', bg: '#ffffff', name: 'Neutral-900 on White' },
  { fg: '#64748b', bg: '#ffffff', name: 'Neutral-500 on White' },
  { fg: '#ffffff', bg: '#0f172a', name: 'White on Neutral-900' },
  { fg: '#ffffff', bg: '#1e293b', name: 'White on Neutral-800' },
  
  // Success/Warning/Danger
  { fg: '#16a34a', bg: '#ffffff', name: 'Success on White' },
  { fg: '#ffffff', bg: '#16a34a', name: 'White on Success' },
  { fg: '#f59e0b', bg: '#ffffff', name: 'Warning on White' },
  { fg: '#ffffff', bg: '#f59e0b', name: 'White on Warning' },
  { fg: '#ef4444', bg: '#ffffff', name: 'Danger on White' },
  { fg: '#ffffff', bg: '#ef4444', name: 'White on Danger' },
];































