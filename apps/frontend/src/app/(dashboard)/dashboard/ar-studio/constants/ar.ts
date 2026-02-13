/**
 * Constants pour AR Studio
 */

import {
  Package,
  Eye,
  Clock,
  Zap,
  Box,
  Home,
  Users,
  Smartphone,
  Monitor,
} from 'lucide-react';
import type { ARModelType } from '../types';

export interface ModelTypeOption {
  value: ARModelType | 'all';
  label: string;
  icon: React.ElementType;
  color: string;
}

export const MODEL_TYPES: ModelTypeOption[] = [
  { value: 'all', label: 'Tous', icon: Package, color: 'gray' },
  { value: 'glasses', label: 'Lunettes', icon: Eye, color: 'blue' },
  { value: 'watch', label: 'Montres', icon: Clock, color: 'purple' },
  { value: 'jewelry', label: 'Bijoux', icon: Zap, color: 'yellow' },
  { value: 'shoes', label: 'Chaussures', icon: Box, color: 'green' },
  { value: 'furniture', label: 'Meubles', icon: Home, color: 'orange' },
  { value: 'clothing', label: 'Vêtements', icon: Users, color: 'pink' },
  { value: 'other', label: 'Autre', icon: Package, color: 'gray' },
];

export const STATUS_OPTIONS = [
  { value: 'all', labelKey: 'common.all' },
  { value: 'active', labelKey: 'arStudio.status.active' },
  { value: 'processing', labelKey: 'arStudio.status.processing' },
  { value: 'draft', labelKey: 'arStudio.status.draft' },
  { value: 'error', labelKey: 'common.error' },
] as const;

export const ACCEPTED_FILE_TYPES = {
  'model/gltf-binary': ['.glb'],
  'model/gltf+json': ['.gltf'],
  'model/usdz': ['.usdz'],
  'application/octet-stream': ['.obj', '.fbx', '.stl'],
};

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export const DEVICE_ICONS = {
  ios: Smartphone,
  android: Smartphone,
  desktop: Monitor,
  tablet: Smartphone,
} as const;



