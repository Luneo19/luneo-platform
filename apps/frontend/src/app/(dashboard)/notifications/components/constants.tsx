import {
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  Settings,
  Gift,
  Sparkles,
  Star,
  DollarSign,
  ShoppingBag,
} from 'lucide-react';

export const typeConfig = {
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Information' },
  success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Succès' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Avertissement' },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Erreur' },
  order: { icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Commande' },
  customization: { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Personnalisation' },
  system: { icon: Settings, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Système' },
  promo: { icon: Gift, color: 'text-pink-400', bg: 'bg-pink-500/20', label: 'Promotion' },
  feature: { icon: Sparkles, color: 'text-indigo-400', bg: 'bg-indigo-500/20', label: 'Nouveauté' },
  achievement: { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Réussite' },
  payment: { icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Paiement' },
  design: { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Design' },
} as const;

export const priorityConfig = {
  low: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Basse' },
  normal: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Normale' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Haute' },
  urgent: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Urgente' },
} as const;
