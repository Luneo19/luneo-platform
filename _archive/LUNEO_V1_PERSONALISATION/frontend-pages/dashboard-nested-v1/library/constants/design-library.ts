/**
 * Design Library – sector prompt templates for Quick Generate
 */
export const SECTOR_PROMPTS = {
  jewelry: [
    {
      label: 'Bague solitaire',
      prompt:
        'Elegant solitaire ring, 18K gold, round diamond, studio lighting, white background',
    },
    {
      label: 'Collier pendentif',
      prompt:
        'Luxury pendant necklace, white gold chain, sapphire gemstone, professional photography',
    },
    {
      label: 'Boucles d’oreilles',
      prompt:
        'Pearl drop earrings, gold hooks, soft shadow, minimalist product shot',
    },
    {
      label: 'Bracelet tennis',
      prompt:
        'Tennis bracelet, round brilliant diamonds, platinum setting, clean white background',
    },
  ],
  watches: [
    {
      label: 'Montre classique',
      prompt:
        'Classic luxury watch, leather strap, roman numerals, studio shot, dark background',
    },
    {
      label: 'Montre sport',
      prompt:
        'Sport chronograph watch, stainless steel, black dial, dynamic angle',
    },
    {
      label: 'Montre minimaliste',
      prompt:
        'Minimalist dress watch, slim case, white dial, leather strap, flat lay',
    },
  ],
  glasses: [
    {
      label: 'Lunettes aviator',
      prompt: 'Aviator sunglasses, gold frame, gradient lens, clean product shot',
    },
    {
      label: 'Lunettes optiques',
      prompt:
        'Designer optical glasses, acetate frame, front view, neutral background',
    },
    {
      label: 'Lunettes de soleil cat-eye',
      prompt:
        'Cat-eye sunglasses, tortoiseshell, fashion photography, studio lighting',
    },
  ],
  accessories: [
    {
      label: 'Ceinture luxe',
      prompt:
        'Leather luxury belt, gold buckle, product shot, white background',
    },
    {
      label: 'Portefeuille',
      prompt:
        'Slim leather wallet, premium stitching, flat lay, soft shadows',
    },
  ],
} as const;

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'COMPLETED', label: 'Terminés' },
  { value: 'ARCHIVED', label: 'Archivés' },
] as const;

export const CATEGORY_FILTER_OPTIONS = [
  { value: 'all', label: 'Toutes' },
  { value: 'jewelry', label: 'Bijoux' },
  { value: 'watches', label: 'Montres' },
  { value: 'glasses', label: 'Lunettes' },
  { value: 'accessories', label: 'Accessoires' },
] as const;

export const DATE_RANGE_OPTIONS = [
  { value: '7', label: '7 derniers jours' },
  { value: '30', label: '30 derniers jours' },
  { value: '90', label: '90 derniers jours' },
  { value: 'all', label: 'Tout' },
] as const;

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'oldest', label: 'Plus anciens' },
  { value: 'name_az', label: 'Nom A–Z' },
  { value: 'name_za', label: 'Nom Z–A' },
  { value: 'most_viewed', label: 'Plus vus' },
] as const;
