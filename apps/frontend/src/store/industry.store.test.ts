import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api/client';
import { useIndustryStore } from './industry.store';
import type { Industry, IndustryConfig } from './industry.store';

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

const mockIndustry: Industry = {
  id: 'ind-1',
  slug: 'tech',
  labelFr: 'Technologie',
  labelEn: 'Technology',
  icon: 'cpu',
  accentColor: '#0066cc',
  description: null,
  isActive: true,
  sortOrder: 0,
};

describe('industry store', () => {
  beforeEach(() => {
    useIndustryStore.getState().reset();
    vi.clearAllMocks();
    mockedApi.get.mockResolvedValue({});
    mockedApi.patch.mockResolvedValue({});
  });

  describe('fetchAllIndustries', () => {
    it('loads industry list', async () => {
      const industries: Industry[] = [mockIndustry];
      mockedApi.get.mockResolvedValueOnce(industries as never);

      await useIndustryStore.getState().fetchAllIndustries();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/industries');
      expect(useIndustryStore.getState().allIndustries).toEqual(industries);
      expect(useIndustryStore.getState().isLoading).toBe(false);
    });

    it('sets empty array when response is not array', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: [] } as never);
      await useIndustryStore.getState().fetchAllIndustries();
      expect(useIndustryStore.getState().allIndustries).toEqual([]);
    });
  });

  describe('setIndustry / selectIndustry', () => {
    it('sets selected industry via API and fetches config', async () => {
      mockedApi.patch.mockResolvedValueOnce(undefined as never);
      mockedApi.get.mockResolvedValueOnce({
        industry: mockIndustry,
        moduleConfigs: [],
        widgetConfigs: [],
        kpiConfigs: [],
        templates: [],
        terminology: [{ id: '1', genericTerm: 'product', customTermFr: 'Produit', customTermEn: 'Product', context: 'general' }],
      } as never);

      await useIndustryStore.getState().setIndustry('tech');

      expect(mockedApi.patch).toHaveBeenCalledWith('/api/v1/organizations/current/industry', {
        industrySlug: 'tech',
      });
      expect(useIndustryStore.getState().currentIndustry).toEqual(mockIndustry);
      expect(useIndustryStore.getState().industryConfig).toBeDefined();
      expect(useIndustryStore.getState().isLoading).toBe(false);
    });
  });

  describe('getTerminology', () => {
    it('returns config terminology for selected industry', async () => {
      const config: IndustryConfig = {
        modules: [],
        widgets: [],
        kpis: [],
        templates: [],
        terminology: { product: 'Produit', order: 'Commande' },
      };
      useIndustryStore.setState({ industryConfig: config });
      expect(useIndustryStore.getState().getTerminology('product')).toBe('Produit');
      expect(useIndustryStore.getState().getTerminology('order')).toBe('Commande');
      expect(useIndustryStore.getState().getTerminology('unknown')).toBe('unknown');
    });

    it('returns generic term when no config or no mapping', () => {
      expect(useIndustryStore.getState().getTerminology('product')).toBe('product');
      useIndustryStore.setState({ industryConfig: { modules: [], widgets: [], kpis: [], templates: [], terminology: {} } });
      expect(useIndustryStore.getState().getTerminology('product')).toBe('product');
    });
  });

  describe('getIndustryConfig', () => {
    it('returns config for selected industry via state', async () => {
      const config: IndustryConfig = {
        modules: [],
        widgets: [],
        kpis: [],
        templates: [],
        terminology: {},
      };
      useIndustryStore.setState({ currentIndustry: mockIndustry, industryConfig: config });
      expect(useIndustryStore.getState().industryConfig).toEqual(config);
      expect(useIndustryStore.getState().currentIndustry).toEqual(mockIndustry);
    });
  });

  describe('fetchCurrentIndustry', () => {
    it('loads industry and config by slug', async () => {
      mockedApi.get.mockResolvedValueOnce({
        industry: mockIndustry,
        moduleConfigs: [],
        widgetConfigs: [],
        kpiConfigs: [],
        templates: [],
        terminology: [],
      } as never);

      await useIndustryStore.getState().fetchCurrentIndustry('tech');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/industries/tech');
      expect(useIndustryStore.getState().currentIndustry).toEqual(mockIndustry);
      expect(useIndustryStore.getState().industryConfig).toEqual({
        modules: [],
        widgets: [],
        kpis: [],
        templates: [],
        terminology: {},
      });
      expect(useIndustryStore.getState().isLoading).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears industry state', () => {
      useIndustryStore.setState({
        currentIndustry: mockIndustry,
        industryConfig: { modules: [], widgets: [], kpis: [], templates: [], terminology: {} },
        allIndustries: [mockIndustry],
        error: 'err',
      });
      useIndustryStore.getState().reset();
      expect(useIndustryStore.getState().currentIndustry).toBeNull();
      expect(useIndustryStore.getState().industryConfig).toBeNull();
      expect(useIndustryStore.getState().allIndustries).toEqual([]);
      expect(useIndustryStore.getState().error).toBeNull();
    });
  });
});
