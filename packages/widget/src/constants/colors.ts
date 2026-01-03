export const PRESET_COLORS = [
  '#000000', // Noir
  '#FFFFFF', // Blanc
  '#FF0000', // Rouge
  '#00FF00', // Vert
  '#0000FF', // Bleu
  '#FFFF00', // Jaune
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#808080', // Gris
  '#FFA500', // Orange
  '#800080', // Violet
  '#FFC0CB', // Rose
] as const;

export const COLOR_PALETTES = {
  basic: PRESET_COLORS,
  pastel: [
    '#FFE5E5',
    '#E5FFE5',
    '#E5E5FF',
    '#FFFFE5',
    '#FFE5FF',
    '#E5FFFF',
  ],
  vibrant: [
    '#FF1744',
    '#00E676',
    '#2979FF',
    '#FFD600',
    '#D500F9',
    '#00E5FF',
  ],
} as const;

