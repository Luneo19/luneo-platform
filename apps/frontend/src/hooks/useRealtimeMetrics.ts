'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { PlanDefinition } from '@/lib/billing-plans';
import type { UsageSummaryPayload } from '@/lib/hooks/useUsageSummary';

export interface RealtimeQueueMetric {
  name: string;
  counts: Record<string, number>;
  isHealthy: boolean;
  lastUpdated: string;
  lastFailedJobId?: string;
  lastFailedReason?: string;
  lastFailedAt?: string;
  oldestWaitingJobId?: string;
  oldestWaitingAt?: string;
}

export interface RealtimeMetricsPayload {
  timestamp: string;
  queues: RealtimeQueueMetric[];
  totals: {
    waiting: number;
    delayed: number;
    active: number;
    failed: number;
    completed: number;
  };
  system: {
    loadAvg1m: number;
    memoryRss: number;
    heapUsed: number;
    uptimeSeconds: number;
  };
}

export interface QuotaRealtimePayload {
  brandId: string;
  plan: PlanDefinition;
  summary: UsageSummaryPayload;
}

export interface UseRealtimeMetricsResult {
  data: RealtimeMetricsPayload | null;
  quotaSummaries: QuotaRealtimePayload[];
  isConnected: boolean;
  isDegraded: boolean;
  lastUpdated: string | null;
  lastEventAt: string | null;
}

const WS_ENDPOINT = process.env.NEXT_PUBLIC_OBSERVABILITY_WS;

const resolveSocketUrl = (): string | null => {
  if (WS_ENDPOINT) {
    return WS_ENDPOINT;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const { protocol, host } = window.location;
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${host}/observability`;
};

export function useRealtimeMetrics(): UseRealtimeMetricsResult {
  const [data, setData] = useState<RealtimeMetricsPayload | null>(null);
  const [quotaSnapshots, setQuotaSnapshots] = useState<Map<string, QuotaRealtimePayload>>(
    () => new Map(),
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isDegraded, setIsDegraded] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const lastUpdatedRef = useRef<string | null>(null);
  const lastHeartbeatRef = useRef<number | null>(null);

  useEffect(() => {
    const url = resolveSocketUrl();
    if (!url) {
      return;
    }

    const socket: Socket = io(url, {
      transports: ['websocket'],
    });

    const markHeartbeat = (timestamp?: string) => {
      const ts = timestamp ? new Date(timestamp).getTime() : Date.now();
      lastHeartbeatRef.current = ts;
      setLastEventAt(new Date(ts).toISOString());
      setIsDegraded(false);
    };

    socket.on('connect', () => {
      setIsConnected(true);
      setIsDegraded(false);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsDegraded(true);
    });

    socket.on('metrics:update', (payload: RealtimeMetricsPayload) => {
      setData(payload);
      lastUpdatedRef.current = payload.timestamp;
      markHeartbeat(payload.timestamp);
    });

    socket.on('quota:bootstrap', (entries: QuotaRealtimePayload[]) => {
      setQuotaSnapshots(new Map(entries.map((entry) => [entry.brandId, entry])));
      markHeartbeat();
    });

    socket.on('quota:update', (entry: QuotaRealtimePayload) => {
      setQuotaSnapshots((prev) => {
        const next = new Map(prev);
        next.set(entry.brandId, entry);
        return next;
      });
      markHeartbeat();
    });

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    const CHECK_INTERVAL_MS = 5_000;
    const HEARTBEAT_TIMEOUT_MS = 15_000;

    const timer = setInterval(() => {
      if (!isConnected) {
        return;
      }
      const last = lastHeartbeatRef.current;
      if (!last) {
        setIsDegraded(true);
        return;
      }
      const diff = Date.now() - last;
      setIsDegraded(diff > HEARTBEAT_TIMEOUT_MS);
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(timer);
    };
  }, [isConnected]);

  return {
    data,
    quotaSummaries: Array.from(quotaSnapshots.values()),
    isConnected,
    isDegraded,
    lastUpdated: lastUpdatedRef.current,
    lastEventAt,
  };
}

