/**
 * ★★★ USE AUTOMATIONS HOOK ★★★
 * Hook SWR pour récupérer les automations email marketing
 */

import useSWR from 'swr';
import { normalizeListResponse } from '@/lib/api/normalize';

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  status: 'active' | 'paused' | 'draft';
  steps: AutomationStep[];
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AutomationStep {
  id: string;
  type: 'email' | 'wait' | 'condition' | 'tag';
  delay?: number; // en heures
  templateId?: string;
  condition?: Record<string, unknown>;
  order: number;
}

/** Error thrown by fetcher with API response details */
class FetcherError extends Error {
  info?: unknown;
  status?: number;
  constructor(message: string, options?: { info?: unknown; status?: number }) {
    super(message);
    this.name = 'FetcherError';
    this.info = options?.info;
    this.status = options?.status;
  }
}

async function fetcher(url: string) {
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new FetcherError('An error occurred while fetching the data.', {
      info: await response.json(),
      status: response.status,
    });
  }

  return response.json();
}

export function useAutomations() {
  const { data, error, isLoading, mutate } = useSWR<Automation[]>(
    '/api/admin/marketing/automations',
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    automations: normalizeListResponse<Automation>(data),
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}

export function useAutomation(automationId: string) {
  const { data, error, isLoading, mutate } = useSWR<Automation>(
    automationId ? `/api/admin/marketing/automations/${automationId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    automation: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
