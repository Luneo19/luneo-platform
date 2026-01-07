/**
 * Constants pour la page Products
 */

import {
  Package,
  Sparkles,
  Clock,
  Eye,
  Tag,
  Globe,
  Zap,
  CheckCircle2,
  XCircle,
  Archive,
  Download,
  Trash2,
  Grid3x3,
  List,
} from 'lucide-react';
import type { BulkAction } from '../types';

export const CATEGORIES = [
  { value: 'all', label: 'Toutes les catégories', icon: Package },
  { value: 'JEWELRY', label: 'Bijoux', icon: Sparkles },
  { value: 'WATCHES', label: 'Montres', icon: Clock },
  { value: 'GLASSES', label: 'Lunettes', icon: Eye },
  { value: 'ACCESSORIES', label: 'Accessoires', icon: Tag },
  { value: 'HOME', label: 'Maison', icon: Globe },
  { value: 'TECH', label: 'Technologie', icon: Zap },
  { value: 'OTHER', label: 'Autre', icon: Package },
] as const;

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts', color: 'gray' },
  { value: 'ACTIVE', label: 'Actif', color: 'green' },
  { value: 'DRAFT', label: 'Brouillon', color: 'yellow' },
  { value: 'INACTIVE', label: 'Inactif', color: 'gray' },
  { value: 'ARCHIVED', label: 'Archivé', color: 'red' },
] as const;

export const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Nom (A-Z)', field: 'name' as const },
  { value: 'name-desc', label: 'Nom (Z-A)', field: 'name' as const },
  { value: 'price-asc', label: 'Prix (Croissant)', field: 'price' as const },
  { value: 'price-desc', label: 'Prix (Décroissant)', field: 'price' as const },
  { value: 'date-desc', label: 'Date (Récent)', field: 'createdAt' as const },
  { value: 'date-asc', label: 'Date (Ancien)', field: 'createdAt' as const },
  { value: 'updated-desc', label: 'Modifié (Récent)', field: 'updatedAt' as const },
  { value: 'views-desc', label: 'Vues (Plus)', field: 'views' as const },
  { value: 'orders-desc', label: 'Commandes (Plus)', field: 'orders' as const },
] as const;

export const BULK_ACTIONS: BulkAction[] = [
  { type: 'activate', label: 'Activer', icon: CheckCircle2, variant: 'default' },
  { type: 'deactivate', label: 'Désactiver', icon: XCircle, variant: 'outline' },
  { type: 'archive', label: 'Archiver', icon: Archive, variant: 'outline' },
  { type: 'export', label: 'Exporter', icon: Download, variant: 'outline' },
  { type: 'delete', label: 'Supprimer', icon: Trash2, variant: 'destructive' },
];

export const VIEW_MODES = {
  grid: { icon: Grid3x3, label: 'Grille' },
  list: { icon: List, label: 'Liste' },
} as const;


