import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api/client';
import { useDashboardStore } from './dashboard.store';
import type { DashboardConfig, KpiValue, UserDashboardPreference } from './dashboard.store';

vi.mock('@/lib/api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  endpoints: {},
}));

const mockedApi = vi.mocked(api);

describe('dashboard store', () => {
  beforeEach(() => {
    useDashboardStore.getState().reset();
    vi.clearAllMocks();
    mockedApi.get.mockResolvedValue({});
    mockedApi.patch.mockResolvedValue({});
    mockedApi.post.mockResolvedValue({});
  });

  describe('fetchDashboardConfig', () => {
    it('loads dashboard statistics/config', async () => {
      const config: DashboardConfig = {
        sidebar: [],
        widgets: [],
        kpis: [],
      };
      const preferences: UserDashboardPreference | null = null;
      mockedApi.get.mockResolvedValueOnce({ config, preferences } as never);

      await useDashboardStore.getState().fetchDashboardConfig();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/dashboard/config');
      expect(useDashboardStore.getState().dashboardConfig).toEqual(config);
      expect(useDashboardStore.getState().userPreferences).toBeNull();
      expect(useDashboardStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Network error'));
      await useDashboardStore.getState().fetchDashboardConfig();
      expect(useDashboardStore.getState().error).toBe('Failed to fetch dashboard config');
      expect(useDashboardStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchKpiValues', () => {
    it('loads KPI values', async () => {
      const kpis: KpiValue[] = [
        {
          slug: 'revenue',
          labelFr: 'Revenu',
          labelEn: 'Revenue',
          icon: 'trending-up',
          value: 1000,
          trend: 5,
          formattedValue: '1 000 €',
        },
      ];
      mockedApi.get.mockResolvedValueOnce(kpis as never);

      await useDashboardStore.getState().fetchKpiValues();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/dashboard/kpis');
      expect(useDashboardStore.getState().kpiValues).toEqual(kpis);
    });
  });

  describe('toggleCustomizing', () => {
    it('toggles sidebar/customizing state', () => {
      expect(useDashboardStore.getState().isCustomizing).toBe(false);
      useDashboardStore.getState().toggleCustomizing();
      expect(useDashboardStore.getState().isCustomizing).toBe(true);
      useDashboardStore.getState().toggleCustomizing();
      expect(useDashboardStore.getState().isCustomizing).toBe(false);
    });
  });

  describe('setActivePage', () => {
    it('store has no setActivePage; reset clears state', () => {
      useDashboardStore.setState({
        dashboardConfig: { sidebar: [], widgets: [], kpis: [] },
        kpiValues: [{ slug: 'x', labelFr: 'x', labelEn: 'x', icon: 'x', value: 0, trend: 0, formattedValue: '0' }],
      });
      useDashboardStore.getState().reset();
      expect(useDashboardStore.getState().dashboardConfig).toBeNull();
      expect(useDashboardStore.getState().kpiValues).toEqual([]);
    });
  });

  describe('fetchWidgetData', () => {
    it('fetches widget data and merges into widgetData', async () => {
      mockedApi.get.mockResolvedValueOnce({ count: 42 } as never);
      await useDashboardStore.getState().fetchWidgetData('sales-widget');
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/dashboard/widgets/sales-widget/data');
      expect(useDashboardStore.getState().widgetData['sales-widget']).toEqual({ count: 42 });
    });
  });

  describe('updatePreferences', () => {
    it('updates user preferences', async () => {
      useDashboardStore.setState({
        userPreferences: {
          id: 'pref-1',
          widgetOverrides: null,
          sidebarOrder: null,
          pinnedModules: null,
          lastVisitedModule: null,
          dashboardTheme: null,
        },
      });
      await useDashboardStore.getState().updatePreferences({ lastVisitedModule: 'products' });
      expect(mockedApi.patch).toHaveBeenCalledWith('/api/v1/dashboard/preferences', {
        lastVisitedModule: 'products',
      });
      expect(useDashboardStore.getState().userPreferences?.lastVisitedModule).toBe('products');
    });
  });

  describe('reset', () => {
    it('clears all dashboard state', () => {
      useDashboardStore.setState({
        dashboardConfig: { sidebar: [], widgets: [], kpis: [] },
        kpiValues: [],
        widgetData: { x: {} },
        isCustomizing: true,
        error: 'err',
      });
      useDashboardStore.getState().reset();
      expect(useDashboardStore.getState().dashboardConfig).toBeNull();
      expect(useDashboardStore.getState().kpiValues).toEqual([]);
      expect(useDashboardStore.getState().widgetData).toEqual({});
      expect(useDashboardStore.getState().userPreferences).toBeNull();
      expect(useDashboardStore.getState().isCustomizing).toBe(false);
      expect(useDashboardStore.getState().error).toBeNull();
    });
  });
});
