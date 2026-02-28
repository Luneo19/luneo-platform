import { create } from 'zustand';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
// ========================================
// TYPES
// ========================================

interface IndustryWidgetConfig {
  slug: string;
  labelFr: string;
  labelEn: string;
  icon: string;
  size: 'sm' | 'md' | 'lg';
}

interface IndustryKpiConfig {
  slug: string;
  labelFr: string;
  labelEn: string;
  icon: string;
  format: string;
}

export interface SidebarItem {
  moduleSlug: string;
  priority: 'PRIMARY' | 'SECONDARY' | 'AVAILABLE' | 'HIDDEN';
  sortOrder: number;
  isEnabled: boolean;
}

export interface DashboardConfig {
  sidebar: SidebarItem[];
  widgets: IndustryWidgetConfig[];
  kpis: IndustryKpiConfig[];
}

export interface KpiValue {
  slug: string;
  labelFr: string;
  labelEn: string;
  icon: string;
  value: number;
  trend: number; // percentage change vs previous period
  formattedValue: string;
}

export interface UserDashboardPreference {
  id: string;
  widgetOverrides: Record<string, unknown> | null;
  sidebarOrder: string[] | null;
  pinnedModules: string[] | null;
  lastVisitedModule: string | null;
  dashboardTheme: string | null;
}

// ========================================
// STORE
// ========================================

interface DashboardState {
  dashboardConfig: DashboardConfig | null;
  kpiValues: KpiValue[];
  widgetData: Record<string, unknown>;
  userPreferences: UserDashboardPreference | null;
  isCustomizing: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDashboardConfig: () => Promise<void>;
  fetchKpiValues: () => Promise<void>;
  fetchWidgetData: (widgetSlug: string) => Promise<void>;
  updatePreferences: (prefs: Partial<UserDashboardPreference>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  toggleCustomizing: () => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  dashboardConfig: null,
  kpiValues: [],
  widgetData: {},
  userPreferences: null,
  isCustomizing: false,
  isLoading: false,
  error: null,

  fetchDashboardConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get<{
        config: DashboardConfig;
        preferences: UserDashboardPreference | null;
      }>('/api/v1/dashboard/config');
      set({
        dashboardConfig: data.config ?? (data as unknown as DashboardConfig),
        userPreferences: data.preferences ?? null,
        isLoading: false,
      });
    } catch (error) {
      logger.error('Failed to fetch dashboard config', error instanceof Error ? error : new Error(String(error)));
      set({ error: 'Failed to fetch dashboard config', isLoading: false });
    }
  },

  fetchKpiValues: async () => {
    try {
      const data = await api.get<KpiValue[]>('/api/v1/dashboard/kpis');
      set({ kpiValues: Array.isArray(data) ? data : [] });
    } catch (error) {
      logger.error('Failed to fetch KPI values', error instanceof Error ? error : new Error(String(error)));
    }
  },

  fetchWidgetData: async (widgetSlug: string) => {
    try {
      const data = await api.get<unknown>(`/api/v1/dashboard/widgets/${widgetSlug}/data`);
      set((state) => ({
        widgetData: { ...state.widgetData, [widgetSlug]: data },
      }));
    } catch (error) {
      logger.error(`Failed to fetch widget data for ${widgetSlug}`, error instanceof Error ? error : new Error(String(error)));
    }
  },

  updatePreferences: async (prefs: Partial<UserDashboardPreference>) => {
    try {
      await api.patch('/api/v1/dashboard/preferences', prefs);
      set((state) => ({
        userPreferences: state.userPreferences
          ? { ...state.userPreferences, ...prefs }
          : null,
      }));
    } catch (error) {
      logger.error('Failed to update preferences', error instanceof Error ? error : new Error(String(error)));
    }
  },

  resetPreferences: async () => {
    try {
      await api.post('/api/v1/dashboard/preferences/reset');
      set({ userPreferences: null });
      // Reload config to get fresh industry defaults
      await get().fetchDashboardConfig();
    } catch (error) {
      logger.error('Failed to reset preferences', error instanceof Error ? error : new Error(String(error)));
    }
  },

  toggleCustomizing: () => {
    set((state) => ({ isCustomizing: !state.isCustomizing }));
  },

  reset: () => {
    set({
      dashboardConfig: null,
      kpiValues: [],
      widgetData: {},
      userPreferences: null,
      isCustomizing: false,
      isLoading: false,
      error: null,
    });
  },
}));
