import { create } from 'zustand';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

// ========================================
// TYPES
// ========================================

export interface Industry {
  id: string;
  slug: string;
  labelFr: string;
  labelEn: string;
  icon: string;
  accentColor: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface IndustryModuleConfig {
  id: string;
  moduleSlug: string;
  priority: 'PRIMARY' | 'SECONDARY' | 'AVAILABLE' | 'HIDDEN';
  sortOrder: number;
  isDefaultEnabled: boolean;
  defaultSettings: Record<string, unknown> | null;
}

export interface IndustryWidgetConfig {
  id: string;
  widgetSlug: string;
  position: number;
  gridColumn: number;
  gridRow: number;
  gridWidth: number;
  gridHeight: number;
  isDefaultVisible: boolean;
}

export interface IndustryKpiConfig {
  id: string;
  kpiSlug: string;
  labelFr: string;
  labelEn: string;
  icon: string;
  sortOrder: number;
  isDefaultVisible: boolean;
  calculationMethod: string | null;
}

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  templateData: Record<string, unknown> | null;
  productType: string | null;
  is3D: boolean;
  modelUrl: string | null;
  sortOrder: number;
}

export interface IndustryTerminologyEntry {
  id: string;
  genericTerm: string;
  customTermFr: string;
  customTermEn: string;
  context: string;
}

export interface IndustryConfig {
  modules: IndustryModuleConfig[];
  widgets: IndustryWidgetConfig[];
  kpis: IndustryKpiConfig[];
  templates: IndustryTemplate[];
  terminology: Record<string, string>;
}

// ========================================
// STORE
// ========================================

interface IndustryState {
  currentIndustry: Industry | null;
  industryConfig: IndustryConfig | null;
  allIndustries: Industry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCurrentIndustry: (slug: string) => Promise<void>;
  fetchAllIndustries: () => Promise<void>;
  setIndustry: (slug: string) => Promise<void>;
  getTerminology: (genericTerm: string) => string;
  reset: () => void;
}

export const useIndustryStore = create<IndustryState>()((set, get) => ({
  currentIndustry: null,
  industryConfig: null,
  allIndustries: [],
  isLoading: false,
  error: null,

  fetchCurrentIndustry: async (slug: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get<{
        industry: Industry;
        moduleConfigs: IndustryModuleConfig[];
        widgetConfigs: IndustryWidgetConfig[];
        kpiConfigs: IndustryKpiConfig[];
        templates: IndustryTemplate[];
        terminology: IndustryTerminologyEntry[];
      }>(`/api/v1/industries/${slug}`);

      const terminologyMap: Record<string, string> = {};
      if (data.terminology) {
        for (const t of data.terminology) {
          terminologyMap[t.genericTerm] = t.customTermFr;
        }
      }

      set({
        currentIndustry: data.industry ?? data as unknown as Industry,
        industryConfig: {
          modules: data.moduleConfigs ?? [],
          widgets: data.widgetConfigs ?? [],
          kpis: data.kpiConfigs ?? [],
          templates: data.templates ?? [],
          terminology: terminologyMap,
        },
        isLoading: false,
      });
    } catch (error) {
      logger.error('Failed to fetch industry', error instanceof Error ? error : new Error(String(error)));
      set({ error: 'Failed to fetch industry', isLoading: false });
    }
  },

  fetchAllIndustries: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get<Industry[]>('/api/v1/industries');
      set({ allIndustries: Array.isArray(data) ? data : [], isLoading: false });
    } catch (error) {
      logger.error('Failed to fetch industries', error instanceof Error ? error : new Error(String(error)));
      set({ error: 'Failed to fetch industries', isLoading: false });
    }
  },

  setIndustry: async (slug: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.patch('/api/v1/organizations/current/industry', { industrySlug: slug });
      await get().fetchCurrentIndustry(slug);
    } catch (error) {
      logger.error('Failed to set industry', error instanceof Error ? error : new Error(String(error)));
      set({ error: 'Failed to set industry', isLoading: false });
    }
  },

  getTerminology: (genericTerm: string): string => {
    const config = get().industryConfig;
    if (config?.terminology && config.terminology[genericTerm]) {
      return config.terminology[genericTerm];
    }
    return genericTerm;
  },

  reset: () => {
    set({
      currentIndustry: null,
      industryConfig: null,
      allIndustries: [],
      isLoading: false,
      error: null,
    });
  },
}));
