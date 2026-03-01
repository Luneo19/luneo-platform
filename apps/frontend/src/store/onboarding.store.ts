import { create } from 'zustand';
import { api, endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export interface OnboardingFormData {
  step1: {
    firstName: string;
    lastName: string;
  };
  step2: {
    companyName: string;
    website: string;
    industry: string;
  };
  step3: {
    sector: string;
    companySize: string;
    objective: string;
  };
  step4: {
    companySize: string;
    agentName: string;
    systemPrompt: string;
    greeting: string;
    tone: string;
    model: string;
  };
  step5: {
    objective: string;
    templateId: string | null;
  };
}

export interface CrawlSiteResult {
  url: string;
  title: string;
  description: string;
  language: string;
  logoUrl?: string;
}

export interface GeneratedPersona {
  agentName: string;
  systemPrompt: string;
  greeting: string;
  tone: string;
  responseStyle: string;
  suggestedFAQ: { question: string; answer: string }[];
  suggestedTopics: string[];
  brandVoice: {
    vocabulary: string[];
    avoidWords: string[];
    communicationStyle: string;
  };
  industry: string;
  language: string;
}

export interface OnboardingProgress {
  id: string;
  organizationId: string;
  userId: string;
  step1Profile: Record<string, unknown> | null;
  step1CompletedAt: string | null;
  step2Industry: string | null;
  step2CompletedAt: string | null;
  step3UseCases: Record<string, unknown> | null;
  step3CompletedAt: string | null;
  step4Goals: Record<string, unknown> | null;
  step4CompletedAt: string | null;
  step5Integrations: Record<string, unknown> | null;
  step5CompletedAt: string | null;
  completedAt: string | null;
  skippedAt: string | null;
}

export interface OnboardingProgressApiResponse {
  currentStep: number;
  progress: OnboardingProgress | null;
}

const INDUSTRY_OPTIONS = [
  { value: 'ECOMMERCE', label: 'E-commerce' },
  { value: 'SAAS', label: 'SaaS / Tech' },
  { value: 'FINTECH', label: 'Fintech / Finance' },
  { value: 'HEALTHCARE', label: 'Santé' },
  { value: 'REAL_ESTATE', label: 'Immobilier' },
  { value: 'INSURANCE', label: 'Assurance' },
  { value: 'EDUCATION', label: 'Éducation' },
  { value: 'AGENCY', label: 'Agence' },
  { value: 'CONSULTING', label: 'Conseil' },
  { value: 'RETAIL', label: 'Commerce de détail' },
  { value: 'HOSPITALITY', label: 'Hôtellerie / Restauration' },
  { value: 'AUTOMOTIVE', label: 'Automobile' },
  { value: 'TRAVEL', label: 'Voyage / Tourisme' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'NONPROFIT', label: 'Association / ONG' },
  { value: 'GOVERNMENT', label: 'Service public' },
  { value: 'OTHER', label: 'Autre' },
] as const;

export { INDUSTRY_OPTIONS };

const ONBOARDING_DISMISS_KEY = 'onboarding_dismissed_until';
const ONBOARDING_DISMISS_WINDOW_MS = 24 * 60 * 60 * 1000;

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  progress: OnboardingProgressApiResponse | null;
  formData: OnboardingFormData;
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;

  crawlResult: CrawlSiteResult | null;
  generatedPersona: GeneratedPersona | null;
  isCrawling: boolean;
  crawlError: string | null;

  createdAgentId: string | null;

  fetchProgress: () => Promise<void>;
  saveStep: (stepNumber: number) => Promise<void>;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  setStepData: <K extends keyof OnboardingFormData>(
    step: K,
    data: Partial<OnboardingFormData[K]>
  ) => void;
  scanWebsite: (url: string, industry?: string) => Promise<void>;
  createAgentFromOnboarding: () => Promise<string | null>;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  reset: () => void;
}

const initialFormData: OnboardingFormData = {
  step1: { firstName: '', lastName: '' },
  step2: { companyName: '', website: '', industry: '' },
  step3: { sector: '', companySize: '', objective: '' },
  step4: {
    companySize: '',
    agentName: '',
    systemPrompt: '',
    greeting: '',
    tone: 'PROFESSIONAL',
    model: 'gpt-4o-mini',
  },
  step5: { objective: '', templateId: null },
};

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  currentStep: 1,
  totalSteps: 7,
  progress: null,
  formData: { ...initialFormData },
  isSubmitting: false,
  isLoading: false,
  error: null,

  crawlResult: null,
  generatedPersona: null,
  isCrawling: false,
  crawlError: null,

  createdAgentId: null,

  fetchProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const raw = await api.get<OnboardingProgressApiResponse & { data?: OnboardingProgressApiResponse }>('/api/v1/onboarding/progress');
      const data = raw?.data ?? raw;
      const rawStep = data?.currentStep;
      const stepNumber = typeof rawStep === 'number' && !Number.isNaN(rawStep) ? rawStep : 0;
      const currentStep = Math.max(1, Math.min(stepNumber + 1, 7));
      const progressData = data?.progress ?? null;

      const formData = { ...initialFormData };
      if (progressData?.step1Profile) {
        const p1 = progressData.step1Profile as Record<string, unknown>;
        formData.step1 = {
          firstName: (p1?.firstName as string) ?? '',
          lastName: (p1?.lastName as string) ?? '',
        };
        if (p1?.website) {
          formData.step2.website = p1.website as string;
        }
        if (p1?.companyName) {
          formData.step2.companyName = p1.companyName as string;
        }
      }
      if (progressData?.step2Industry) {
        formData.step2.industry = progressData.step2Industry;
        formData.step3.sector = progressData.step2Industry;
      }
      if (progressData?.step3UseCases) {
        const p3 = progressData.step3UseCases as Record<string, unknown>;
        if (typeof p3.companySize === 'string') formData.step4.companySize = p3.companySize;
        if (Array.isArray(p3.goals) && typeof p3.goals[0] === 'string') {
          formData.step5.objective = p3.goals[0];
        }
      }

      set({
        progress: { currentStep, progress: progressData },
        currentStep,
        formData,
        isLoading: false,
      });
    } catch (error) {
      logger.error('Failed to fetch onboarding progress', error instanceof Error ? error : new Error(String(error)));
      set({ error: 'Erreur lors du chargement', isLoading: false });
    }
  },

  saveStep: async (stepNumber: number) => {
    const { formData } = get();
    set({ isSubmitting: true, error: null });
    try {
      if (stepNumber === 1) {
        const fullName = `${formData.step1.firstName} ${formData.step1.lastName}`.trim();
        await api.post('/api/v1/onboarding/step/1', {
          data: {
            name: fullName,
            firstName: formData.step1.firstName,
            lastName: formData.step1.lastName,
            companyName: formData.step2.companyName || 'Mon entreprise',
            website: formData.step2.website,
          },
        });
      } else if (stepNumber === 2) {
        await api.post('/api/v1/onboarding/step/2', {
          data: { industrySlug: formData.step2.industry, sector: formData.step2.industry },
        });
      } else if (stepNumber === 3) {
        await api.post('/api/v1/onboarding/step/3', {
          data: { industrySlug: formData.step3.sector, sector: formData.step3.sector },
        });
      } else if (stepNumber === 4) {
        await api.post('/api/v1/onboarding/step/3', {
          data: { companySize: formData.step4.companySize, goals: [formData.step5.objective || 'other'] },
        });
      } else if (stepNumber === 5) {
        await api.post('/api/v1/onboarding/step/3', {
          data: { companySize: formData.step4.companySize, goals: [formData.step5.objective || 'other'] },
        });
      }
      set({ isSubmitting: false });
    } catch (error) {
      logger.error(`Failed to save onboarding step ${stepNumber}`, error instanceof Error ? error : new Error(String(error)));
      set({ error: `Erreur à l'étape ${stepNumber}`, isSubmitting: false });
      throw error;
    }
  },

  scanWebsite: async (url: string, industry?: string) => {
    set({ isCrawling: true, crawlError: null });
    try {
      const result = await endpoints.webCrawler.generatePersona(url, industry);
      const data = (result as { data?: { data?: { crawl: CrawlSiteResult; persona: GeneratedPersona } } })?.data?.data
        ?? (result as { data?: { crawl: CrawlSiteResult; persona: GeneratedPersona } })?.data
        ?? (result as { crawl: CrawlSiteResult; persona: GeneratedPersona });

      const crawl = data?.crawl;
      const persona = data?.persona;

      set((state) => ({
        crawlResult: crawl ?? null,
        generatedPersona: persona ?? null,
        isCrawling: false,
        formData: {
          ...state.formData,
          step4: {
            companySize: state.formData.step4.companySize,
            agentName: persona?.agentName ?? state.formData.step4.agentName,
            systemPrompt: persona?.systemPrompt ?? state.formData.step4.systemPrompt,
            greeting: persona?.greeting ?? state.formData.step4.greeting,
            tone: persona?.tone ?? state.formData.step4.tone,
            model: state.formData.step4.model,
          },
          step2: {
            ...state.formData.step2,
            industry: persona?.industry ? mapDetectedIndustry(persona.industry) : state.formData.step2.industry,
          },
          step3: {
            ...state.formData.step3,
            sector: persona?.industry ? mapDetectedIndustry(persona.industry) : state.formData.step3.sector,
          },
        },
      }));
    } catch (error) {
      logger.error('Website scan failed', error instanceof Error ? error : new Error(String(error)));
      set({ isCrawling: false, crawlError: 'Impossible d\'analyser ce site. Vous pouvez continuer manuellement.' });
    }
  },

  createAgentFromOnboarding: async () => {
    const { formData, generatedPersona } = get();
    set({ isSubmitting: true, error: null });
    try {
      const payload = {
        name: formData.step4.agentName || 'Mon premier agent',
        description: generatedPersona?.responseStyle ?? '',
        model: formData.step4.model,
        temperature: 0.3,
        tone: formData.step4.tone,
        languages: [generatedPersona?.language ?? 'fr'],
        systemPrompt: formData.step4.systemPrompt,
        greeting: formData.step4.greeting,
        templateId: formData.step5.templateId ?? undefined,
      };
      const res = await endpoints.agents.create(payload);
      const agent = res as { id?: string; data?: { id?: string } };
      const newId = agent?.id ?? agent?.data?.id ?? null;
      set({ createdAgentId: newId, isSubmitting: false });
      return newId;
    } catch (error) {
      logger.error('Failed to create agent during onboarding', error instanceof Error ? error : new Error(String(error)));
      set({ error: 'Erreur lors de la création de l\'agent', isSubmitting: false });
      return null;
    }
  },

  nextStep: () => {
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, state.totalSteps),
    }));
  },

  previousStep: () => {
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    }));
  },

  goToStep: (step: number) => {
    set({ currentStep: Math.max(1, Math.min(step, get().totalSteps)) });
  },

  setStepData: (step, data) => {
    set((state) => ({
      formData: {
        ...state.formData,
        [step]: { ...state.formData[step], ...data },
      },
    }));
  },

  completeOnboarding: async () => {
    set({ isSubmitting: true, error: null });
    try {
      await api.post('/api/v1/onboarding/complete');
      document.cookie = 'onboarding_completed=true; path=/; max-age=31536000; SameSite=Lax';
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(ONBOARDING_DISMISS_KEY);
      }
      set({ isSubmitting: false });
    } catch (error) {
      logger.error('Failed to complete onboarding', error instanceof Error ? error : new Error(String(error)));
      set({ error: 'Erreur lors de la finalisation', isSubmitting: false });
      throw error;
    }
  },

  skipOnboarding: async () => {
    set({ isSubmitting: true, error: null });
    try {
      // Best effort: persist skip intention server-side but do not block UX on API failures.
      await api.post('/api/v1/onboarding/skip').catch((error) => {
        logger.warn('Skip onboarding API failed, keeping local dismiss state only', {
          error: error instanceof Error ? error.message : String(error),
        });
      });

      const dismissedUntil = Date.now() + ONBOARDING_DISMISS_WINDOW_MS;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ONBOARDING_DISMISS_KEY, String(dismissedUntil));
      }
      document.cookie = 'onboarding_completed=dismissed; path=/; max-age=86400; SameSite=Lax';
      set({ isSubmitting: false });
    } catch (error) {
      logger.error('Failed to skip onboarding', error instanceof Error ? error : new Error(String(error)));
      // Even on unexpected failures, keep the local dismiss behavior to avoid blocking users.
      const dismissedUntil = Date.now() + ONBOARDING_DISMISS_WINDOW_MS;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ONBOARDING_DISMISS_KEY, String(dismissedUntil));
      }
      document.cookie = 'onboarding_completed=dismissed; path=/; max-age=86400; SameSite=Lax';
      set({ error: null, isSubmitting: false });
    }
  },

  reset: () => {
    set({
      currentStep: 1,
      progress: null,
      formData: { ...initialFormData },
      isSubmitting: false,
      isLoading: false,
      error: null,
      crawlResult: null,
      generatedPersona: null,
      isCrawling: false,
      crawlError: null,
      createdAgentId: null,
    });
  },
}));

function mapDetectedIndustry(detected: string): string {
  const lower = detected.toLowerCase();
  const mapping: Record<string, string> = {
    'e-commerce': 'ECOMMERCE',
    'ecommerce': 'ECOMMERCE',
    'saas': 'SAAS',
    'tech': 'SAAS',
    'technology': 'SAAS',
    'finance': 'FINTECH',
    'fintech': 'FINTECH',
    'banking': 'FINTECH',
    'health': 'HEALTHCARE',
    'healthcare': 'HEALTHCARE',
    'médical': 'HEALTHCARE',
    'santé': 'HEALTHCARE',
    'real estate': 'REAL_ESTATE',
    'immobilier': 'REAL_ESTATE',
    'insurance': 'INSURANCE',
    'assurance': 'INSURANCE',
    'education': 'EDUCATION',
    'formation': 'EDUCATION',
    'agency': 'AGENCY',
    'agence': 'AGENCY',
    'consulting': 'CONSULTING',
    'conseil': 'CONSULTING',
    'retail': 'RETAIL',
    'commerce': 'RETAIL',
    'hotel': 'HOSPITALITY',
    'restaurant': 'HOSPITALITY',
    'hospitality': 'HOSPITALITY',
    'hôtellerie': 'HOSPITALITY',
    'automobile': 'AUTOMOTIVE',
    'auto': 'AUTOMOTIVE',
    'travel': 'TRAVEL',
    'tourisme': 'TRAVEL',
    'voyage': 'TRAVEL',
    'media': 'MEDIA',
    'nonprofit': 'NONPROFIT',
    'association': 'NONPROFIT',
    'government': 'GOVERNMENT',
  };

  for (const [key, value] of Object.entries(mapping)) {
    if (lower.includes(key)) return value;
  }
  return 'OTHER';
}
