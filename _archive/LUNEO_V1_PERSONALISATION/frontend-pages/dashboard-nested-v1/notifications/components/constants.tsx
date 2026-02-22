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
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20', labelKey: 'notifications.typeInfo' as const },
  success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', labelKey: 'notifications.typeSuccess' as const },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', labelKey: 'notifications.typeWarning' as const },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', labelKey: 'notifications.typeError' as const },
  order: { icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/20', labelKey: 'notifications.typeOrder' as const },
  customization: { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/20', labelKey: 'notifications.typeCustomization' as const },
  system: { icon: Settings, color: 'text-gray-400', bg: 'bg-gray-500/20', labelKey: 'notifications.typeSystem' as const },
  promo: { icon: Gift, color: 'text-pink-400', bg: 'bg-pink-500/20', labelKey: 'notifications.typePromo' as const },
  feature: { icon: Sparkles, color: 'text-indigo-400', bg: 'bg-indigo-500/20', labelKey: 'notifications.typeFeature' as const },
  achievement: { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/20', labelKey: 'notifications.typeAchievement' as const },
  payment: { icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20', labelKey: 'notifications.typePayment' as const },
  design: { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/20', labelKey: 'notifications.typeDesign' as const },
} as const;

export const priorityConfig = {
  low: { color: 'text-gray-400', bg: 'bg-gray-500/20', labelKey: 'notifications.priorityLow' as const },
  normal: { color: 'text-blue-400', bg: 'bg-blue-500/20', labelKey: 'notifications.priorityNormal' as const },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/20', labelKey: 'notifications.priorityHigh' as const },
  urgent: { color: 'text-red-400', bg: 'bg-red-500/20', labelKey: 'notifications.priorityUrgent' as const },
} as const;
