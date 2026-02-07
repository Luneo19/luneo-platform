import { Zap, Server, Shield } from 'lucide-react';
import type { ReactNode } from 'react';

export const metricIcons: Record<string, ReactNode> = {
  designs_created: <Zap className="h-4 w-4 text-violet-400" />,
  renders_2d: <Server className="h-4 w-4 text-cyan-400" />,
  renders_3d: <Shield className="h-4 w-4 text-emerald-400" />,
  ai_generations: <Zap className="h-4 w-4 text-pink-400" />,
  storage_gb: <Server className="h-4 w-4 text-amber-400" />,
  api_calls: <Zap className="h-4 w-4 text-blue-400" />,
  team_members: <Shield className="h-4 w-4 text-slate-300" />,
};

export const timelineSeverityDot: Record<string, string> = {
  info: 'bg-sky-400 border-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.5)]',
  warning: 'bg-amber-400 border-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.5)]',
  critical: 'bg-rose-500 border-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.7)]',
};

export const projectionStatusBadge: Record<
  'ok' | 'warning' | 'critical',
  'outline' | 'secondary' | 'destructive'
> = {
  ok: 'outline',
  warning: 'secondary',
  critical: 'destructive',
};

export const projectionStatusLabel: Record<'ok' | 'warning' | 'critical', string> = {
  ok: 'Stable',
  warning: 'Sous tension',
  critical: 'Action immédiate',
};
