'use client';

import React, { useState } from 'react';
import { Sparkles, Bell, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComingSoonBadgeProps {
  label?: string;
  className?: string;
  /** Show inline pill badge (default) or overlay an entire card */
  variant?: 'badge' | 'overlay';
  /** Enable "Notify me" email capture */
  showNotify?: boolean;
  /** Feature key for localStorage tracking */
  featureKey?: string;
}

export function ComingSoonBadge({
  label = 'Bientôt disponible',
  className,
  variant = 'badge',
  showNotify = false,
  featureKey,
}: ComingSoonBadgeProps) {
  const storageKey = featureKey ? `luneo_notify_${featureKey}` : null;
  const [subscribed, setSubscribed] = useState(() => {
    if (typeof window === 'undefined' || !storageKey) return false;
    return localStorage.getItem(storageKey) === '1';
  });

  const handleNotify = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (storageKey) {
      localStorage.setItem(storageKey, '1');
      setSubscribed(true);
    }
  };

  if (variant === 'overlay') {
    return (
      <div className={cn(
        'absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-black/40 backdrop-blur-[2px]',
        className,
      )}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/[0.12] text-xs font-medium text-white/80">
          <Sparkles className="w-3 h-3 text-amber-400" />
          {label}
        </div>
        {showNotify && !subscribed && (
          <button
            onClick={handleNotify}
            className="mt-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] text-white/60 hover:text-white/80 hover:bg-white/[0.10] transition-colors"
          >
            <Bell className="w-2.5 h-2.5" />
            Notifiez-moi
          </button>
        )}
        {showNotify && subscribed && (
          <span className="mt-2 flex items-center gap-1 text-[10px] text-green-400">
            <Check className="w-2.5 h-2.5" />
            Notifié
          </span>
        )}
      </div>
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium',
      className,
    )}>
      <Sparkles className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}
