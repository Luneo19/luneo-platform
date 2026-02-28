/**
 * Tests for Onboarding Page Component
 * Tests critical conversion-flow component: onboarding page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
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
  step1: { firstName: '', lastName: '' },
  step2: { companyName: '', website: '', industry: '' },
  step3: { sector: '', companySize: '', objective: '' },
  step4: { companySize: '', agentName: '', systemPrompt: '', greeting: '', tone: 'PROFESSIONAL', model: 'gpt-4o-mini' },
  step5: { objective: '', templateId: null },
};

const mockNextStep = vi.fn();
const mockPreviousStep = vi.fn();
const mockSaveStep = vi.fn().mockResolvedValue(undefined);
const mockCompleteOnboarding = vi.fn().mockResolvedValue(undefined);
const mockSkipOnboarding = vi.fn().mockResolvedValue(undefined);
const mockSetStepData = vi.fn();
const mockFetchProgress = vi.fn();

vi.mock('@/store/onboarding.store', () => ({
  useOnboardingStore: () => ({
    formData: mockFormData,
    currentStep: 1,
    totalSteps: 7,
    isSubmitting: false,
    isLoading: false,
    error: null,
    fetchProgress: mockFetchProgress,
    saveStep: mockSaveStep,
    nextStep: mockNextStep,
    previousStep: mockPreviousStep,
    setStepData: mockSetStepData,
    completeOnboarding: mockCompleteOnboarding,
    skipOnboarding: mockSkipOnboarding,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { firstName: 'Test', lastName: 'User' },
  }),
}));

// Mock industry store
const mockFetchAllIndustries = vi.fn().mockResolvedValue([]);
vi.mock('@/store/industry.store', () => ({
  useIndustryStore: (
    selector?: (state: {
      fetchAllIndustries: () => Promise<unknown[]>;
      industries: unknown[];
      isLoading: boolean;
    }) => unknown
  ) => {
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
  LazyMotionDiv: ({ children, ...props }: { children: ReactNode } & ComponentProps<'div'>) => (
    <div {...props}>{children}</div>
  ),
  LazyAnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Mock ErrorBoundary
vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Step2Industry component
vi.mock('../components/Step2Industry', () => ({
  Step2Industry: ({ selectedIndustry: _selectedIndustry, onSelectIndustry: _onSelectIndustry }: {
    selectedIndustry: unknown;
    onSelectIndustry: (industry: unknown) => void;
  }) => (
    <div data-testid="step2-industry">
      <h1>Secteur d&apos;activité</h1>
      <p>Sélectionnez votre secteur</p>
    </div>
  ),
}));

// Mock i18n for step 1 placeholders and labels
vi.mock('@/i18n/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'onboarding.welcome': 'Bienvenue sur Luneo',
        'onboarding.letsGetStarted': 'Commençons par faire connaissance',
        'onboarding.continue': 'Continuer',
        'onboarding.skip': 'Passer',
      };
      return map[key] ?? key;
    },
    locale: 'fr',
    setLocale: () => {},
  }),
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
      expect(screen.getByText(/commençons par vous connaître/i)).toBeInTheDocument();
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
      
      expect(screen.getByPlaceholderText(/jean/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/dupont/i)).toBeInTheDocument();
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
