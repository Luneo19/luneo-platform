/**
 * Tests for Onboarding Page Component
 * Tests critical conversion-flow component: onboarding page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnboardingPage from '../page';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/onboarding',
}));

// Mock onboarding store
const mockFormData = {
  step1: { name: '', company: '', role: '', teamSize: '' },
  step2: { industrySlug: '' },
  step3: { useCases: [] },
  step4: { goals: [] },
  step5: { integrations: [] },
};

const mockNextStep = vi.fn();
const mockPreviousStep = vi.fn();
const mockSaveStep = vi.fn().mockResolvedValue(undefined);
const mockCompleteOnboarding = vi.fn().mockResolvedValue(undefined);
const mockSkipOnboarding = vi.fn().mockResolvedValue(undefined);
const mockSetStepData = vi.fn();
const mockSetSelectedIndustry = vi.fn();
const mockFetchProgress = vi.fn();

vi.mock('@/store/onboarding.store', () => ({
  useOnboardingStore: () => ({
    formData: mockFormData,
    currentStep: 1,
    totalSteps: 6,
    isSubmitting: false,
    selectedIndustry: null,
    fetchProgress: mockFetchProgress,
    saveStep: mockSaveStep,
    nextStep: mockNextStep,
    previousStep: mockPreviousStep,
    setStepData: mockSetStepData,
    setSelectedIndustry: mockSetSelectedIndustry,
    completeOnboarding: mockCompleteOnboarding,
    skipOnboarding: mockSkipOnboarding,
  }),
}));

// Mock industry store
const mockFetchAllIndustries = vi.fn().mockResolvedValue([]);
vi.mock('@/store/industry.store', () => ({
  useIndustryStore: (selector?: (state: any) => any) => {
    const state = {
      fetchAllIndustries: mockFetchAllIndustries,
      industries: [],
      isLoading: false,
    };
    return selector ? selector(state) : state;
  },
}));

// Mock dynamic motion components
vi.mock('@/lib/performance/dynamic-motion', () => ({
  LazyMotionDiv: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  LazyAnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock ErrorBoundary
vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Step2Industry component
vi.mock('../components/Step2Industry', () => ({
  Step2Industry: ({ selectedIndustry, onSelectIndustry }: any) => (
    <div data-testid="step2-industry">
      <h1>Secteur d&apos;activité</h1>
      <p>Sélectionnez votre secteur</p>
    </div>
  ),
}));

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render onboarding page without crashing', () => {
      const { container } = render(<OnboardingPage />);
      expect(container).toBeTruthy();
    });

    it('should render step 1 (welcome) by default', () => {
      render(<OnboardingPage />);
      
      expect(screen.getByText(/bienvenue sur luneo/i)).toBeInTheDocument();
      expect(screen.getByText(/commençons par faire connaissance/i)).toBeInTheDocument();
    });

    it('should show progress indicators', () => {
      render(<OnboardingPage />);
      
      // Check for step indicators (6 steps total)
      const stepIcons = screen.getAllByRole('generic').filter(
        (el) => el.className?.includes('rounded-full') || el.querySelector('svg')
      );
      expect(stepIcons.length).toBeGreaterThan(0);
    });

    it('should render progress bar', () => {
      render(<OnboardingPage />);
      
      // Progress bar should be present
      const progressBar = document.querySelector('[role="progressbar"]') || 
                          document.querySelector('.h-2');
      expect(progressBar).toBeTruthy();
    });


    it('should render step 1 form fields', () => {
      render(<OnboardingPage />);
      
      // Check for input fields in step 1 using placeholders
      expect(screen.getByPlaceholderText(/jean dupont/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/ma super entreprise/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/ceo, marketing/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/1-10, 10-50/i)).toBeInTheDocument();
    });

    it('should render navigation buttons correctly', () => {
      render(<OnboardingPage />);
      
      // Continue button should be present
      const continueButton = screen.getByRole('button', { name: /continuer/i });
      expect(continueButton).toBeInTheDocument();
      
      // Skip button should be present
      const skipButton = screen.getByRole('button', { name: /passer/i });
      expect(skipButton).toBeInTheDocument();
    });
  });
});
