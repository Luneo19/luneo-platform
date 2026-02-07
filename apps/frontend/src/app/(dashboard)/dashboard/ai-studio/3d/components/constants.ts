/**
 * Shared constants for AI Studio 3D page components
 */

import {
  Box,
  Zap,
  Clock,
  CheckCircle2,
  Heart,
  Layers,
} from 'lucide-react';

export const STAT_CARDS = [
  { label: 'Générations', key: 'totalGenerations', color: 'cyan', icon: Box },
  { label: 'Crédits utilisés', key: 'totalCredits', color: 'blue', icon: Zap },
  { label: 'Temps moyen', key: 'avgGenerationTime', color: 'green', icon: Clock },
  { label: 'Taux de succès', key: 'successRate', color: 'purple', icon: CheckCircle2 },
  { label: 'Favoris', key: 'favoriteCount', color: 'pink', icon: Heart },
  { label: 'Polygons moyen', key: 'avgPolyCount', color: 'orange', icon: Layers },
] as const;

export const EXPORT_FORMATS = [
  { format: 'GLB', description: 'Format binaire glTF (recommandé)', size: '8.2 MB', compatible: true },
  { format: 'OBJ', description: 'Format Wavefront OBJ', size: '12.5 MB', compatible: true },
  { format: 'STL', description: 'Stéréolithographie (impression 3D)', size: '15.3 MB', compatible: true },
  { format: 'USDZ', description: 'Universal Scene Description (AR)', size: '9.1 MB', compatible: true },
  { format: 'FBX', description: 'Autodesk FBX', size: '18.7 MB', compatible: false },
  { format: 'PLY', description: 'Polygon File Format', size: '11.2 MB', compatible: true },
] as const;

export const CATEGORY_OPTIONS = [
  { value: 'product', label: 'Produit' },
  { value: 'furniture', label: 'Mobilier' },
  { value: 'jewelry', label: 'Bijoux' },
  { value: 'electronics', label: 'Électronique' },
  { value: 'fashion', label: 'Mode' },
  { value: 'automotive', label: 'Automobile' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'other', label: 'Autre' },
] as const;

export const COMPLEXITY_OPTIONS = [
  { value: 'low', label: 'Simple (10-20k poly)' },
  { value: 'medium', label: 'Moyenne (30-50k poly)' },
  { value: 'high', label: 'Élevée (50-100k poly)' },
  { value: 'ultra', label: 'Ultra (100k+ poly)' },
] as const;

export const RESOLUTION_OPTIONS = [
  { value: 'low', label: 'Basse (512×512)' },
  { value: 'medium', label: 'Moyenne (1024×1024)' },
  { value: 'high', label: 'Haute (2048×2048)' },
  { value: 'ultra', label: 'Ultra (4096×4096)' },
] as const;
