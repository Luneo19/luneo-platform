import {
  FileText,
  AlertCircle,
  User,
  Plus,
  HelpCircle,
  Share2,
} from 'lucide-react';
import type { ResponseTemplate } from './types';
import type { StatusConfigItem, PriorityConfigItem, CategoryConfigItem } from './types';

export const statusConfig: Record<string, StatusConfigItem> = {
  OPEN: { label: 'Ouvert', color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' },
  IN_PROGRESS: { label: 'En cours', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/30' },
  WAITING_CUSTOMER: { label: 'En attente client', color: 'text-orange-400', bgColor: 'bg-orange-500/20 border-orange-500/30' },
  RESOLVED: { label: 'Résolu', color: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500/30' },
  CLOSED: { label: 'Fermé', color: 'text-gray-400', bgColor: 'bg-gray-500/20 border-gray-500/30' },
  CANCELLED: { label: 'Annulé', color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30' },
  open: { label: 'Ouvert', color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' },
  pending: { label: 'En cours', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/30' },
  closed: { label: 'Fermé', color: 'text-gray-400', bgColor: 'bg-gray-500/20 border-gray-500/30' },
};

export const priorityConfig: Record<string, PriorityConfigItem> = {
  LOW: { label: 'Basse', color: 'text-gray-400', borderColor: 'border-gray-500' },
  MEDIUM: { label: 'Moyenne', color: 'text-blue-400', borderColor: 'border-blue-500' },
  HIGH: { label: 'Haute', color: 'text-orange-400', borderColor: 'border-orange-500' },
  URGENT: { label: 'Urgente', color: 'text-red-400', borderColor: 'border-red-500' },
  low: { label: 'Basse', color: 'text-gray-400', borderColor: 'border-gray-500' },
  medium: { label: 'Moyenne', color: 'text-blue-400', borderColor: 'border-blue-500' },
  high: { label: 'Haute', color: 'text-orange-400', borderColor: 'border-orange-500' },
};

export const categoryConfig: Record<string, CategoryConfigItem> = {
  BILLING: { label: 'Facturation', icon: FileText },
  TECHNICAL: { label: 'Technique', icon: AlertCircle },
  ACCOUNT: { label: 'Compte', icon: User },
  FEATURE_REQUEST: { label: 'Fonctionnalité', icon: Plus },
  BUG: { label: 'Bug', icon: AlertCircle },
  INTEGRATION: { label: 'Intégration', icon: Share2 },
  OTHER: { label: 'Autre', icon: HelpCircle },
};

export const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  {
    id: '1',
    name: 'Accusé de réception',
    content: 'Merci de nous avoir contactés. Nous avons bien reçu votre demande et notre équipe va l\'examiner dans les plus brefs délais.',
    category: 'GENERAL',
    tags: ['accusé', 'réception'],
  },
  {
    id: '2',
    name: 'Résolution technique',
    content: 'Nous avons identifié le problème et appliqué une correction. Le problème devrait maintenant être résolu. N\'hésitez pas à nous contacter si vous rencontrez d\'autres difficultés.',
    category: 'TECHNICAL',
    tags: ['résolution', 'technique'],
  },
  {
    id: '3',
    name: 'Demande d\'informations',
    content: 'Afin de mieux vous aider, pourriez-vous nous fournir des informations supplémentaires concernant votre demande ?',
    category: 'GENERAL',
    tags: ['information', 'demande'],
  },
];
