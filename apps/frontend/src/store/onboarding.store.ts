import { create } from 'zustand';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

// ========================================
// TYPES
// ========================================

export interface OnboardingFormData {
  step1: {
    firstName: string;
    lastName: string;
  };
  step2: {
    companyName: string;
    website: string;
  };
  step3: {
    sector: string;
  };
  step4: {
    companySize: string;
  };
  step5: {
    objective: string;
  };
  step6: {
    templateSelected: boolean;
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

/** Maps form companySize to backend CompanySize enum value */
function mapTeamSizeToCompanySize(companySize: string): string | undefined {
  const map: Record<string, string> = {
    SOLO: 'SOLO',
    SMALL: 'SMALL_2_10',
    MEDIUM: 'MEDIUM_11_50',
    LARGE: 'LARGE_51_200',
    ENTERPRISE: 'ENTERPRISE_200_PLUS',
    '1': 'SOLO',
    '2-10': 'SMALL_2_10',
    '11-50': 'MEDIUM_11_50',
    '51-200': 'LARGE_51_200',
    '200+': 'ENTERPRISE_200_PLUS',
  };
  return map[companySize] ?? undefined;
}

// ========================================
// STORE
// ========================================

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  progress: OnboardingProgressApiResponse | null;
  selectedSector: string | null;
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
  setSelectedSector: (sector: string) => void;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  reset: () => void;
}

const initialFormData: OnboardingFormData = {
  step1: { firstName: '', lastName: '' },
  step2: { companyName: '', website: '' },
  step3: { sector: '' },
  step4: { companySize: '' },
  step5: { objective: '' },
  step6: { templateSelected: false },
};

/** Maps V2 sector to backend industry slug */
function mapSectorToIndustrySlug(sector: string): string {
  const map: Record<string, string> = {
    ECOMMERCE: 'print_on_demand',
    SAAS: 'other',
    FINTECH: 'other',
    HEALTHCARE: 'other',
    RETAIL: 'fashion',
    OTHER: 'other',
  };
  return map[sector] ?? 'other';
}

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  currentStep: 1,
  totalSteps: 7, // 7 steps V2
  progress: null,
  selectedSector: null,
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
      // Backend returns currentStep 0–5 (next step to show) or 6 (completed). UI V2 has 7 steps; map 0-5 → 1-6, 6 → 7.
      const currentStep = stepNumber >= 6 ? 7 : Math.min(stepNumber + 1, 6);
      const progressData = data?.progress ?? null;

      // Restore form data from data.progress (V2 mapping)
      const formData = { ...initialFormData };
      if (progressData?.step1Profile) {
        const p1 = progressData.step1Profile as Record<string, unknown>;
        const firstName = (p1?.firstName as string) ?? '';
        const lastName = (p1?.lastName as string) ?? '';
        const fullName = (p1?.name as string) ?? '';
        const parts = fullName ? fullName.split(' ') : [];
        formData.step1 = {
          firstName: firstName || parts[0] || '',
          lastName: lastName || parts.slice(1).join(' ') || '',
        };
        if (p1?.companyName) formData.step2.companyName = p1.companyName as string;
        if (p1?.website) formData.step2.website = p1.website as string;
      }
      const p2 = progressData?.step2Industry;
      if (p2) formData.step3 = { sector: p2 };
      const p3 = progressData?.step3UseCases as Record<string, unknown> | null;
      if (p3?.companySize) formData.step4 = { companySize: p3.companySize as string };
      const p4 = progressData?.step4Goals as Record<string, unknown> | null;
      if (p4?.goals?.[0]) formData.step5 = { objective: (p4.goals as string[])[0] };

      set({
        progress: { currentStep, progress: progressData },
        currentStep,
        selectedSector: progressData?.step2Industry ?? null,
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
      // V2: Map UI steps (1-7) to API steps (1-5). Steps 6-7 are UI-only.
      if (stepNumber === 6) {
        set({ isSubmitting: false });
        return; // No API call for "create first agent" step
      }
      if (stepNumber === 7) {
        set({ isSubmitting: false });
        return; // completeOnboarding handles this
      }
      let apiStep: number;
      let payload: Record<string, unknown>;
      if (stepNumber === 1) {
        apiStep = 1;
        const fullName = `${formData.step1.firstName} ${formData.step1.lastName}`.trim();
        payload = {
          name: fullName,
          firstName: formData.step1.firstName,
          lastName: formData.step1.lastName,
          companyName: formData.step2.companyName || 'Mon entreprise',
        };
      } else if (stepNumber === 2) {
        apiStep = 1;
        const fullName = `${formData.step1.firstName} ${formData.step1.lastName}`.trim();
        payload = {
          name: fullName,
          companyName: formData.step2.companyName || 'Mon entreprise',
          website: formData.step2.website,
        };
      } else if (stepNumber === 3) {
        apiStep = 2;
        payload = { industrySlug: mapSectorToIndustrySlug(formData.step3.sector) };
      } else if (stepNumber === 4) {
        apiStep = 3;
        payload = { companySize: formData.step4.companySize };
      } else if (stepNumber === 5) {
        apiStep = 4;
        payload = { goals: [formData.step5.objective] };
      } else {
        set({ isSubmitting: false });
        return;
      }
      await api.post(`/api/v1/onboarding/step/${apiStep}`, { data: payload });
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

  setSelectedSector: (sector: string) => {
    set((state) => ({
      selectedSector: sector,
      formData: {
        ...state.formData,
        step3: { sector },
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
      selectedSector: null,
      formData: { ...initialFormData },
      isSubmitting: false,
      isLoading: false,
      error: null,
    });
  },
}));
