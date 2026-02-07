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

// ========================================
// STORE
// ========================================

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  progress: OnboardingProgress | null;
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
      const data = await api.get<OnboardingProgress>('/api/v1/onboarding/progress');
      const progress = data;

      // Determine which step the user is on based on progress
      let currentStep = 1;
      if (progress.step1CompletedAt) currentStep = 2;
      if (progress.step2CompletedAt) currentStep = 3;
      if (progress.step3CompletedAt) currentStep = 4;
      if (progress.step4CompletedAt) currentStep = 5;
      if (progress.step5CompletedAt) currentStep = 6;

      // Restore form data from progress
      const formData = { ...initialFormData };
      if (progress.step1Profile) {
        formData.step1 = progress.step1Profile as OnboardingFormData['step1'];
      }
      if (progress.step2Industry) {
        formData.step2 = { industrySlug: progress.step2Industry };
      }
      if (progress.step3UseCases) {
        formData.step3 = progress.step3UseCases as OnboardingFormData['step3'];
      }
      if (progress.step4Goals) {
        formData.step4 = progress.step4Goals as OnboardingFormData['step4'];
      }
      if (progress.step5Integrations) {
        formData.step5 = progress.step5Integrations as OnboardingFormData['step5'];
      }

      set({
        progress,
        currentStep,
        selectedIndustry: progress.step2Industry ?? null,
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
      await api.post(`/api/v1/onboarding/step/${stepNumber}`, {
        data: formData[stepKey],
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
