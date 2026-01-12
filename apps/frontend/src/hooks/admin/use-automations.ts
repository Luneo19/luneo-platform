/**
 * ★★★ USE AUTOMATIONS HOOK ★★★
 * Hook SWR pour récupérer les automations email marketing
 */

import useSWR from 'swr';

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
  condition?: any;
  order: number;
}

async function fetcher(url: string) {
  const response = await fetch(url, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // @ts-ignore
    error.info = await response.json();
    // @ts-ignore
    error.status = response.status;
    throw error;
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
    automations: data || [],
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
