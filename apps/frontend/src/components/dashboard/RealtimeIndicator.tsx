/**
 * Realtime Indicator Component
 * A-010: Indicateur de connexion temps réel et feed d'événements
 */

'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { LazyMotionDiv as Motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Wifi,
  WifiOff,
  Activity,
  Bell,
  Zap,
  ShoppingCart,
  Palette,
  TrendingUp,
  X,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealtime, RealtimeEvent } from '@/lib/realtime';

interface RealtimeIndicatorProps {
  showFeed?: boolean;
  maxFeedItems?: number;
  position?: 'top-right' | 'bottom-right' | 'bottom-left';
}

function RealtimeIndicatorComponent({
  showFeed = true,
  maxFeedItems = 5,
  position = 'bottom-right',
}: RealtimeIndicatorProps) {
  const { isConnected, lastEvent: _lastEvent, subscribe, error } = useRealtime();
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNewEvents, setHasNewEvents] = useState(false);

  // Subscribe to all events
  useEffect(() => {
    const unsubscribe = subscribe('*', (data, event) => {
      // Don't show heartbeats in feed
      const payload = data as Record<string, unknown> | undefined;
      if (event.type === 'system_alert' && payload?.message === 'heartbeat') return;
      if (event.type === 'system_alert' && payload?.message === 'Connected') return;

      setEvents(prev => [event, ...prev].slice(0, maxFeedItems));
      setHasNewEvents(true);
    });

    return unsubscribe;
  }, [subscribe, maxFeedItems]);

  // Clear new events indicator when expanded
  useEffect(() => {
    if (isExpanded) {
      setHasNewEvents(false);
    }
  }, [isExpanded]);

  const getEventIcon = useCallback((type: string) => {
    switch (type) {
      case 'metrics_update':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'design_created':
        return <Palette className="w-4 h-4 text-purple-400" />;
      case 'order_created':
        return <ShoppingCart className="w-4 h-4 text-green-400" />;
      case 'notification':
        return <Bell className="w-4 h-4 text-yellow-400" />;
      case 'conversion':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  }, []);

  const getEventTitle = useCallback((event: RealtimeEvent): string => {
    const data = event.data as Record<string, unknown> | undefined;
    switch (event.type) {
      case 'metrics_update':
        return `Métriques: ${data?.visitors ?? 0} visiteurs`;
      case 'design_created':
        return `Nouveau design: ${data?.name ?? ''}`;
      case 'order_created':
        return `Commande: ${data?.amount ?? 0}€`;
      case 'notification':
        return String(data?.title ?? '');
      case 'conversion':
        return `Conversion: ${data?.type ?? ''}`;
      default:
        return event.type;
    }
  }, []);

  const formatTime = useCallback((timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)}m`;
    return new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Connection Status */}
      <Motion
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-end gap-2"
      >
        {/* Status Badge */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => showFeed && setIsExpanded(!isExpanded)}
          className={`
            border-slate-700 bg-slate-900/90 backdrop-blur-sm
            ${isConnected ? 'hover:border-green-500/50' : 'hover:border-red-500/50'}
          `}
        >
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400">Live</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-400">Offline</span>
              </>
            )}
            {showFeed && (
              <>
                {hasNewEvents && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </>
            )}
          </div>
        </Button>

        {/* Event Feed */}
        <AnimatePresence>
          {showFeed && isExpanded && (
            <Motion
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="w-80 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium">Activité en direct</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-slate-800 rounded"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Events List */}
              <div className="max-h-64 overflow-y-auto">
                {events.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-sm">
                    En attente d'événements...
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {events.map((event, index) => (
                      <Motion
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{getEventIcon(event.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {String(getEventTitle(event))}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatTime(event.timestamp)}
                            </p>
                          </div>
                        </div>
                      </Motion>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {events.length > 0 && (
                <div className="p-2 border-t border-slate-800 bg-slate-800/50">
                  <button
                    onClick={() => setEvents([])}
                    className="w-full text-xs text-slate-400 hover:text-slate-300 py-1"
                  >
                    Effacer l'historique
                  </button>
                </div>
              )}
            </Motion>
          )}
        </AnimatePresence>
      </Motion>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <Motion
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-300"
          >
            {error}
          </Motion>
        )}
      </AnimatePresence>
    </div>
  );
}

const RealtimeIndicatorMemo = memo(RealtimeIndicatorComponent);

export function RealtimeIndicator(props: RealtimeIndicatorProps) {
  return (
    <ErrorBoundary componentName="RealtimeIndicator">
      <RealtimeIndicatorMemo {...props} />
    </ErrorBoundary>
  );
}

export default RealtimeIndicator;


