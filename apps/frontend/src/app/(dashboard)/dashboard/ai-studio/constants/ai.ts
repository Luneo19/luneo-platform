/**
 * Constants pour AI Studio
 */

import { ImageIcon, Box, Film, Layers, Sparkles } from 'lucide-react';
import type { GenerationType, AIModel } from '../types';

export interface GenerationTypeOption {
  value: GenerationType;
  label: string;
  icon: React.ElementType;
  description: string;
  credits: number;
}

export const GENERATION_TYPES: GenerationTypeOption[] = [
  {
    value: '2d',
    label: 'Génération 2D',
    icon: ImageIcon,
    description: 'Images, designs, logos',
    credits: 10,
  },
  {
    value: '3d',
    label: 'Génération 3D',
    icon: Box,
    description: 'Modèles 3D',
    credits: 25,
  },
  {
    value: 'animation',
    label: 'Animations',
    icon: Film,
    description: 'Vidéos, GIFs',
    credits: 50,
  },
  {
    value: 'template',
    label: 'Templates',
    icon: Layers,
    description: 'Templates prédéfinis',
    credits: 5,
  },
];

export const AI_MODELS: { value: AIModel; label: string; description: string }[] = [
  { value: 'dall-e-3', label: 'DALL-E 3', description: 'Qualité supérieure' },
  { value: 'midjourney', label: 'Midjourney', description: 'Style artistique' },
  { value: 'stable-diffusion', label: 'Stable Diffusion', description: 'Open source' },
  { value: 'leonardo', label: 'Leonardo.ai', description: 'Rapide et efficace' },
];

export const SIZE_OPTIONS = [
  { value: '1024x1024', label: '1024×1024 (Carré)' },
  { value: '1792x1024', label: '1792×1024 (Paysage)' },
  { value: '1024x1792', label: '1024×1792 (Portrait)' },
] as const;

export const QUALITY_OPTIONS = [
  { value: 'standard', label: 'Standard', credits: 1 },
  { value: 'hd', label: 'HD', credits: 2 },
] as const;

export const STYLE_OPTIONS = [
  { value: 'vivid', label: 'Vif' },
  { value: 'natural', label: 'Naturel' },
] as const;


