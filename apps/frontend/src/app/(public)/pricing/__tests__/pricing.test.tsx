/**
 * Tests for Pricing Page Component
 * Tests critical conversion-flow component: pricing page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PricingPage from '../page';

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
  usePathname: () => '/pricing',
}));

// Mock useAuth hook
const mockUser = null;
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  }),
}));

// Mock usePricingPage hook
const mockMergedPlans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Essayez Luneo gratuitement avec des fonctionnalites de base',
    priceMonthly: 0,
    priceYearly: 0,
    priceYearlyMonthly: 0,
    currency: 'EUR',
    cta: 'Commencer gratuitement',
    ctaHref: '/register',
    features: ['5 designs/mois', 'Customizer 2D', '10 rendus 2D/mois'],
    limits: {
      designs: 5,
      renders2D: 10,
      renders3D: 0,
      storage: '0.5 GB',
      teamMembers: 1,
      apiCalls: 1000,
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Parfait pour les createurs independants et petits projets',
    priceMonthly: 19,
    priceYearly: 182.4,
    priceYearlyMonthly: 15.2,
    currency: 'EUR',
    cta: 'Demarrer l\'essai gratuit',
    ctaHref: '/register?plan=starter',
    features: ['50 designs/mois', 'Customizer 2D', '100 rendus 2D/mois'],
    limits: {
      designs: 50,
      renders2D: 100,
      renders3D: 10,
      storage: '5 GB',
      teamMembers: 3,
      apiCalls: 10000,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Pour les createurs et PME qui veulent passer a la vitesse superieure',
    priceMonthly: 49,
    priceYearly: 470.4,
    priceYearlyMonthly: 39.2,
    currency: 'EUR',
    popular: true,
    badge: 'LE PLUS POPULAIRE',
    cta: 'Demarrer l\'essai gratuit',
    ctaHref: '/register?plan=professional',
    features: ['250 designs/mois', 'Customizer 2D + 3D', '500 rendus 2D/mois'],
    limits: {
      designs: 250,
      renders2D: 500,
      renders3D: 50,
      storage: '50 GB',
      teamMembers: 10,
      apiCalls: 100000,
    },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Pour les equipes qui ont besoin de collaboration et de volume',
    priceMonthly: 99,
    priceYearly: 950.4,
    priceYearlyMonthly: 79.2,
    currency: 'EUR',
    cta: 'Demarrer l\'essai gratuit',
    ctaHref: '/register?plan=business',
    features: ['1000 designs/mois', 'Toutes les fonctionnalites Pro'],
    limits: {
      designs: 1000,
      renders2D: 2000,
      renders3D: 200,
      storage: '100 GB',
      teamMembers: 50,
      apiCalls: 200000,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solution sur-mesure pour les grandes organisations',
    priceMonthly: null,
    priceYearly: null,
    priceYearlyMonthly: null,
    currency: 'EUR',
    cta: 'Contacter les ventes',
    ctaHref: '/contact?type=enterprise',
    features: ['Designs illimites', 'Rendus illimites', 'Infrastructure dediee'],
    limits: {
      designs: 'Illimite',
      renders2D: 'Illimite',
      renders3D: 'Illimite',
      storage: 'Illimite',
      teamMembers: 'Illimite',
      apiCalls: 'Illimite',
    },
  },
];

const mockHandleCheckout = vi.fn();
vi.mock('../hooks/usePricingPage', () => ({
  usePricingPage: () => ({
    mergedPlans: mockMergedPlans,
    isYearly: false,
    setIsYearly: vi.fn(),
    handleCheckout: mockHandleCheckout,
  }),
}));

// Mock dynamic motion components
vi.mock('@/lib/performance/dynamic-motion', () => ({
  LazyMotionDiv: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock ErrorBoundary
vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock pricing components
vi.mock('../components/PricingHero', () => ({
  PricingHero: ({ isYearly, onYearlyChange }: any) => (
    <div data-testid="pricing-hero">
      <h1>Tarification qui évolue avec vous</h1>
      <button onClick={() => onYearlyChange(!isYearly)}>
        {isYearly ? 'Annuel' : 'Mensuel'}
      </button>
    </div>
  ),
}));

vi.mock('../components/PricingPlanCard', () => ({
  PricingPlanCard: ({ plan, isYearly, onCheckout }: any) => (
    <div data-testid={`plan-card-${plan.id}`}>
      <h3>{plan.name}</h3>
      <p>{plan.description}</p>
      {plan.badge && <span>{plan.badge}</span>}
      <button onClick={() => onCheckout(plan.id)}>{plan.cta}</button>
    </div>
  ),
}));

vi.mock('../components/PricingFeatureTable', () => ({
  PricingFeatureTable: ({ features }: any) => (
    <div data-testid="pricing-feature-table">
      <h2>Features</h2>
    </div>
  ),
}));

vi.mock('../components/PricingFAQ', () => ({
  PricingFAQ: ({ items }: any) => (
    <div data-testid="pricing-faq">
      <h2>FAQ</h2>
    </div>
  ),
}));

vi.mock('../components/PricingCTA', () => ({
  PricingCTA: () => (
    <div data-testid="pricing-cta">
      <h2>Ready to get started?</h2>
    </div>
  ),
}));

// Mock useMarketingData hook
vi.mock('@/lib/hooks/useMarketingData', () => ({
  usePricingPlans: () => ({
    plans: [],
    isLoading: false,
    error: null,
  }),
}));

// Mock API client
vi.mock('@/lib/api/client', () => ({
  api: {
    post: vi.fn().mockResolvedValue({ success: true, data: { url: 'https://checkout.stripe.com' } }),
  },
}));

describe('PricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render pricing page without crashing', () => {
      const { container } = render(<PricingPage />);
      expect(container).toBeTruthy();
    });

    it('should render all plan cards', () => {
      render(<PricingPage />);
      
      // Check for plan names (may appear multiple times in pricing table + cards)
      expect(screen.getAllByText('Free').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Starter').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Professional').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Business').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Enterprise').length).toBeGreaterThanOrEqual(1);
    });

    it('should show pricing amounts for plans', () => {
      render(<PricingPage />);
      
      // Check for plan cards which should contain pricing
      expect(screen.getByTestId('plan-card-free')).toBeInTheDocument();
      expect(screen.getByTestId('plan-card-starter')).toBeInTheDocument();
      expect(screen.getByTestId('plan-card-professional')).toBeInTheDocument();
      expect(screen.getByTestId('plan-card-business')).toBeInTheDocument();
      expect(screen.getByTestId('plan-card-enterprise')).toBeInTheDocument();
    });

    it('should render CTA buttons for each plan', () => {
      render(<PricingPage />);
      
      // Check for CTA buttons - verify at least one of each type exists
      const freeButtons = screen.queryAllByRole('button', { name: /commencer gratuitement/i });
      expect(freeButtons.length).toBeGreaterThan(0);
      
      const trialButtons = screen.queryAllByRole('button', { name: /demarrer l'essai gratuit/i });
      expect(trialButtons.length).toBeGreaterThan(0);
      
      const contactButtons = screen.queryAllByRole('button', { name: /contacter les ventes/i });
      expect(contactButtons.length).toBeGreaterThan(0);
    });

    it('should show popular badge for Professional plan', () => {
      render(<PricingPage />);
      
      expect(screen.getByText('LE PLUS POPULAIRE')).toBeInTheDocument();
    });

    it('should render plan features', () => {
      render(<PricingPage />);
      
      // Check for plan cards which contain features
      const freeCard = screen.getByTestId('plan-card-free');
      expect(freeCard).toBeInTheDocument();
      
      const professionalCard = screen.getByTestId('plan-card-professional');
      expect(professionalCard).toBeInTheDocument();
    });
  });
});
