import type { LucideIcon } from 'lucide-react';
import {
  Package,
  Sparkles,
  Clock,
  Eye,
  Tag,
  Globe,
  Zap,
  Grid3x3,
  List,
  Square,
  Circle,
  Star,
  MinusCircle,
} from 'lucide-react';

export const CATEGORIES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'all', label: 'Toutes les catégories', icon: Package },
  { value: 'JEWELRY', label: 'Bijoux', icon: Sparkles },
  { value: 'WATCHES', label: 'Montres', icon: Clock },
  { value: 'GLASSES', label: 'Lunettes', icon: Eye },
  { value: 'ACCESSORIES', label: 'Accessoires', icon: Tag },
  { value: 'HOME', label: 'Maison', icon: Globe },
  { value: 'TECH', label: 'Technologie', icon: Zap },
  { value: 'OTHER', label: 'Autre', icon: Package },
];

export const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'all', label: 'Tous les statuts', color: 'gray' },
  { value: 'ACTIVE', label: 'Actif', color: 'green' },
  { value: 'DRAFT', label: 'Brouillon', color: 'yellow' },
  { value: 'INACTIVE', label: 'Inactif', color: 'gray' },
  { value: 'ARCHIVED', label: 'Archivé', color: 'red' },
];

export const VIEW_MODES = {
  grid: { icon: Grid3x3, label: 'Grille' },
  list: { icon: List, label: 'Liste' },
} as const;

export type ViewModeKey = keyof typeof VIEW_MODES;

export const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Comic Sans MS',
  'Trebuchet MS',
  'Impact',
  'Tahoma',
];

export const FONT_STYLES = [
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Gras' },
  { value: 'italic', label: 'Italique' },
  { value: 'bold italic', label: 'Gras Italique' },
];

export const SHAPE_TYPES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'rect', label: 'Rectangle', icon: Square },
  { value: 'circle', label: 'Cercle', icon: Circle },
  { value: 'star', label: 'Étoile', icon: Star },
  { value: 'line', label: 'Ligne', icon: MinusCircle },
];

export const EXPORT_FORMATS = [
  { value: 'png', label: 'PNG', description: 'Image haute qualité' },
  { value: 'svg', label: 'SVG', description: 'Vectoriel scalable' },
  { value: 'pdf', label: 'PDF', description: 'Document imprimable' },
  { value: 'jpg', label: 'JPG', description: 'Image compressée' },
];
