/**
 * Constants pour AI Studio Templates
 */

import { Palette, Box, Film, Layers, ImageIcon, Package } from 'lucide-react';
import type { TemplateCategory } from '../types';

export interface CategoryOption {
  value: TemplateCategory | 'all';
  label: string;
  icon: React.ElementType;
  color: string;
}

export const TEMPLATE_CATEGORIES: CategoryOption[] = [
  { value: 'all', label: 'Tous', icon: Package, color: 'text-gray-400' },
  { value: 'logo', label: 'Logos', icon: Palette, color: 'text-blue-400' },
  { value: 'product', label: 'Produits', icon: Box, color: 'text-green-400' },
  { value: 'animation', label: 'Animations', icon: Film, color: 'text-purple-400' },
  { value: 'design', label: 'Designs', icon: Layers, color: 'text-yellow-400' },
  { value: 'illustration', label: 'Illustrations', icon: ImageIcon, color: 'text-pink-400' },
  { value: 'other', label: 'Autre', icon: Package, color: 'text-gray-400' },
];

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Populaire' },
  { value: 'recent', label: 'Récent' },
  { value: 'rating', label: 'Mieux notés' },
  { value: 'downloads', label: 'Plus téléchargés' },
  { value: 'name', label: 'Nom A-Z' },
] as const;


