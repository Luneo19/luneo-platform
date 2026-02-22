/**
 * STUB: Industry store (V1 feature archived)
 * Provides default values for V1 code that still references industry config
 */
import { create } from 'zustand';

interface Industry {
  id: string;
  name: string;
  slug: string;
  icon: string;
  labelFr: string;
  labelEn: string;
  description: string;
  accentColor: string;
}

interface IndustryState {
  currentIndustry: string | null;
  industryConfig: Record<string, unknown>;
  allIndustries: Industry[];
  isLoading: boolean;
  setIndustry: (industry: string) => void;
}

const DEFAULT_INDUSTRIES: Industry[] = [
  { id: 'ecommerce', name: 'E-commerce', slug: 'ecommerce', icon: '🛒', labelFr: 'E-commerce', labelEn: 'E-commerce', accentColor: '#10B981', description: 'Boutiques en ligne et marketplaces' },
  { id: 'saas', name: 'SaaS', slug: 'saas', icon: '💻', labelFr: 'SaaS', labelEn: 'SaaS', accentColor: '#6366F1', description: 'Logiciels en tant que service' },
  { id: 'fintech', name: 'Fintech', slug: 'fintech', icon: '💰', labelFr: 'Fintech', labelEn: 'Fintech', accentColor: '#F59E0B', description: 'Services financiers et bancaires' },
  { id: 'healthcare', name: 'Sante', slug: 'healthcare', icon: '🏥', labelFr: 'Sante', labelEn: 'Healthcare', accentColor: '#EF4444', description: 'Sante et bien-etre' },
  { id: 'education', name: 'Education', slug: 'education', icon: '📚', labelFr: 'Education', labelEn: 'Education', accentColor: '#8B5CF6', description: 'Formation et enseignement' },
  { id: 'retail', name: 'Retail', slug: 'retail', icon: '🏪', labelFr: 'Retail', labelEn: 'Retail', accentColor: '#EC4899', description: 'Commerce de detail' },
  { id: 'agency', name: 'Agence', slug: 'agency', icon: '🏢', labelFr: 'Agence', labelEn: 'Agency', accentColor: '#14B8A6', description: 'Agences et consulting' },
  { id: 'other', name: 'Autre', slug: 'other', icon: '🔧', labelFr: 'Autre', labelEn: 'Other', accentColor: '#6B7280', description: 'Autre secteur' },
];

export const useIndustryStore = create<IndustryState>((set) => ({
  currentIndustry: null,
  industryConfig: {},
  allIndustries: DEFAULT_INDUSTRIES,
  isLoading: false,
  setIndustry: (industry: string) => set({ currentIndustry: industry }),
}));
