/**
 * Constants pour la page Library
 */

import { Package, Layers, Image as ImageIcon, Star, Book } from 'lucide-react';
import type { TemplateCategory } from '../types';

export interface CategoryOption {
  value: string;
  label: string;
  icon: React.ElementType;
}

export const CATEGORIES: CategoryOption[] = [
  { value: 'all', label: 'Tous', icon: Package },
  { value: 'tshirt', label: 'T-Shirts', icon: Layers },
  { value: 'mug', label: 'Mugs', icon: Package },
  { value: 'poster', label: 'Posters', icon: ImageIcon },
  { value: 'sticker', label: 'Stickers', icon: Star },
  { value: 'card', label: 'Cartes', icon: Book },
];

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Récent' },
  { value: 'popular', label: 'Populaire' },
  { value: 'name', label: 'Nom' },
  { value: 'size', label: 'Taille' },
] as const;

export const ITEMS_PER_PAGE = 12;



