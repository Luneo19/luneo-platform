import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOnboardingStore } from './onboarding.store';
import { api } from '@/lib/api/client';

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

describe('onboarding.store', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
    vi.clearAllMocks();
    mockedApi.get.mockResolvedValue({} as never);
    mockedApi.post.mockResolvedValue({} as never);
  });

  describe('fetchProgress', () => {
    it('loads onboarding state', async () => {
      const progressResponse = {
        currentStep: 0,
        progress: {
          id: 'prog-1',
          organizationId: 'org-1',
          userId: 'user-1',
          step1Profile: { name: 'Jane', company: 'Acme', role: 'Admin', teamSize: '2-10' },
          step1CompletedAt: '2024-01-01T00:00:00Z',
          step2Industry: 'tech',
          step2CompletedAt: '2024-01-01T00:00:00Z',
          step3UseCases: null,
          step3CompletedAt: null,
          step4Goals: null,
          step4CompletedAt: null,
          step5Integrations: null,
          step5CompletedAt: null,
          completedAt: null,
          skippedAt: null,
        },
      };
      mockedApi.get.mockResolvedValueOnce(progressResponse as never);

      await useOnboardingStore.getState().fetchProgress();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/onboarding/progress');
      expect(useOnboardingStore.getState().progress).toEqual(progressResponse);
      expect(useOnboardingStore.getState().currentStep).toBe(1); // 0 + 1 = 1
      expect(useOnboardingStore.getState().formData.step1.name).toBe('Jane');
      expect(useOnboardingStore.getState().formData.step2.industrySlug).toBe('tech');
      expect(useOnboardingStore.getState().isLoading).toBe(false);
    });
  });

  describe('saveStep', () => {
    it('saves current step data', async () => {
      useOnboardingStore.getState().setStepData('step1', {
        name: 'John',
        company: 'Co',
        role: 'User',
        teamSize: '1',
      });
      await useOnboardingStore.getState().saveStep(1);
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/onboarding/step/1', {
        data: expect.objectContaining({ name: 'John', companyName: 'Co', role: 'User', teamSize: '1' }),
      });
      expect(useOnboardingStore.getState().isSubmitting).toBe(false);
    });
  });

  describe('nextStep', () => {
    it('increments step (bounded by totalSteps)', () => {
      const { nextStep, totalSteps } = useOnboardingStore.getState();
      expect(useOnboardingStore.getState().currentStep).toBe(1);
      nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(2);
      nextStep();
      nextStep();
      nextStep();
      nextStep(); // 6
      expect(useOnboardingStore.getState().currentStep).toBe(6);
      nextStep(); // still 6
      expect(useOnboardingStore.getState().currentStep).toBe(totalSteps);
    });
  });

  describe('previousStep', () => {
    it('decrements step (bounded at 1)', () => {
      const { nextStep, previousStep } = useOnboardingStore.getState();
      nextStep();
      nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(3);
      previousStep();
      expect(useOnboardingStore.getState().currentStep).toBe(2);
      previousStep();
      expect(useOnboardingStore.getState().currentStep).toBe(1);
      previousStep(); // already 1
      expect(useOnboardingStore.getState().currentStep).toBe(1);
    });
  });

  describe('completeOnboarding', () => {
    it('marks onboarding as complete', async () => {
      await useOnboardingStore.getState().completeOnboarding();
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/onboarding/complete');
      expect(useOnboardingStore.getState().isSubmitting).toBe(false);
    });
  });

  describe('skipOnboarding', () => {
    it('allows skipping onboarding', async () => {
      await useOnboardingStore.getState().skipOnboarding();
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/onboarding/skip');
      expect(useOnboardingStore.getState().isSubmitting).toBe(false);
    });
  });
});
