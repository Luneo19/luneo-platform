import { create } from 'zustand';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

// ========================================
// TYPES
// ========================================

export interface OnboardingFormData {
  step1: {
    name: string;
    company: string;
    role: string;
    teamSize: string;
  };
  step2: {
    industrySlug: string;
  };
  step3: {
    useCases: string[];
  };
  step4: {
    goals: string[];
  };
  step5: {
    integrations: string[];
  };
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

/** API response shape for GET /api/v1/onboarding/progress */
export interface OnboardingProgressApiResponse {
  currentStep: number;
  progress: OnboardingProgress | null;
}

/** Maps form teamSize string to backend CompanySize enum value */
function mapTeamSizeToCompanySize(teamSize: string): string | undefined {
  const map: Record<string, string> = {
    '1': 'SOLO',
    '2-10': 'SMALL_2_10',
    '11-50': 'MEDIUM_11_50',
    '51-200': 'LARGE_51_200',
    '200+': 'ENTERPRISE_200_PLUS',
  };
  return map[teamSize] ?? undefined;
}

// ========================================
// STORE
// ========================================

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  progress: OnboardingProgressApiResponse | null;
  selectedIndustry: string | null;
  formData: OnboardingFormData;
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProgress: () => Promise<void>;
  saveStep: (stepNumber: number) => Promise<void>;
  nextStep: () => void;
  previousStep: () => void;
  setStepData: <K extends keyof OnboardingFormData>(
    step: K,
    data: Partial<OnboardingFormData[K]>
  ) => void;
  setSelectedIndustry: (slug: string) => void;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  reset: () => void;
}

const initialFormData: OnboardingFormData = {
  step1: { name: '', company: '', role: '', teamSize: '' },
  step2: { industrySlug: '' },
  step3: { useCases: [] },
  step4: { goals: [] },
  step5: { integrations: [] },
};

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  currentStep: 1,
  totalSteps: 6, // 5 data steps + 1 confirmation
  progress: null,
  selectedIndustry: null,
  formData: { ...initialFormData },
  isSubmitting: false,
  isLoading: false,
  error: null,

  fetchProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const raw = await api.get<OnboardingProgressApiResponse & { data?: OnboardingProgressApiResponse }>('/api/v1/onboarding/progress');
      // Support both { currentStep, progress } and { data: { currentStep, progress } }
      const data = raw?.data ?? raw;
      const rawStep = data?.currentStep;
      const stepNumber = typeof rawStep === 'number' && !Number.isNaN(rawStep) ? rawStep : 0;
      // Backend returns currentStep 0–5 (next step to show) or 6 (completed). UI is 1-based; normalize so 0 → 1.
      const currentStep = stepNumber >= 6 ? 6 : stepNumber + 1;
      const progressData = data?.progress ?? null;

      // Restore form data from data.progress
      const formData = { ...initialFormData };
      if (progressData?.step1Profile) {
        formData.step1 = progressData.step1Profile as OnboardingFormData['step1'];
      }
      if (progressData?.step2Industry) {
        formData.step2 = { industrySlug: progressData.step2Industry };
      }
      if (progressData?.step3UseCases) {
        formData.step3 = progressData.step3UseCases as OnboardingFormData['step3'];
      }
      if (progressData?.step4Goals) {
        formData.step4 = progressData.step4Goals as OnboardingFormData['step4'];
      }
      if (progressData?.step5Integrations) {
        formData.step5 = progressData.step5Integrations as OnboardingFormData['step5'];
      }

      set({
        progress: { currentStep, progress: progressData },
        currentStep,
        selectedIndustry: progressData?.step2Industry ?? null,
        formData,
        isLoading: false,
      });
    } catch (error) {
      logger.error('Failed to fetch onboarding progress', error instanceof Error ? error : new Error(String(error)));
      set({ error: 'Failed to fetch onboarding progress', isLoading: false });
    }
  },

  saveStep: async (stepNumber: number) => {
    const { formData } = get();
    set({ isSubmitting: true, error: null });
    try {
      const stepKey = `step${stepNumber}` as keyof OnboardingFormData;
      let payload: Record<string, unknown> = formData[stepKey] as Record<string, unknown>;
      if (stepNumber === 1) {
        const step1 = formData.step1;
        const companySize = mapTeamSizeToCompanySize(step1.teamSize);
        payload = {
          name: step1.name,
          companyName: step1.company,
          role: step1.role,
          ...(companySize !== undefined && { companySize }),
          teamSize: step1.teamSize,
        };
      }
      await api.post(`/api/v1/onboarding/step/${stepNumber}`, {
        data: payload,
      });
      set({ isSubmitting: false });
    } catch (error) {
      logger.error(`Failed to save onboarding step ${stepNumber}`, error instanceof Error ? error : new Error(String(error)));
      set({
        error: `Failed to save step ${stepNumber}`,
        isSubmitting: false,
      });
      throw error;
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

  setStepData: (step, data) => {
    set((state) => ({
      formData: {
        ...state.formData,
        [step]: { ...state.formData[step], ...data },
      },
    }));
  },

  setSelectedIndustry: (slug: string) => {
    set((state) => ({
      selectedIndustry: slug,
      formData: {
        ...state.formData,
        step2: { industrySlug: slug },
      },
    }));
  },

  completeOnboarding: async () => {
    set({ isSubmitting: true, error: null });
    try {
      await api.post('/api/v1/onboarding/complete');
      // Set cookie so middleware knows onboarding is done (avoids redirect loop)
      document.cookie = 'onboarding_completed=true; path=/; max-age=31536000; SameSite=Lax';
      set({ isSubmitting: false });
    } catch (error) {
      logger.error('Failed to complete onboarding', error instanceof Error ? error : new Error(String(error)));
      set({ error: 'Failed to complete onboarding', isSubmitting: false });
      throw error;
    }
  },

  skipOnboarding: async () => {
    set({ isSubmitting: true, error: null });
    try {
      await api.post('/api/v1/onboarding/skip');
      // Set cookie so middleware knows onboarding is done (avoids redirect loop)
      document.cookie = 'onboarding_completed=true; path=/; max-age=31536000; SameSite=Lax';
      set({ isSubmitting: false });
    } catch (error) {
      logger.error('Failed to skip onboarding', error instanceof Error ? error : new Error(String(error)));
      set({ error: 'Failed to skip onboarding', isSubmitting: false });
      throw error;
    }
  },

  reset: () => {
    set({
      currentStep: 1,
      progress: null,
      selectedIndustry: null,
      formData: { ...initialFormData },
      isSubmitting: false,
      isLoading: false,
      error: null,
    });
  },
}));
