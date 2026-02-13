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

/** Category values for 3D generation (labels come from i18n in GenerateParamsPanel) */
export const CATEGORY_VALUES = [
  'product',
  'furniture',
  'jewelry',
  'electronics',
  'fashion',
  'automotive',
  'architecture',
  'other',
] as const;

/** Complexity values for 3D generation (labels from i18n) */
export const COMPLEXITY_VALUES = ['low', 'medium', 'high', 'ultra'] as const;

/** Resolution values for 3D generation (labels from i18n) */
export const RESOLUTION_VALUES = ['low', 'medium', 'high', 'ultra'] as const;
