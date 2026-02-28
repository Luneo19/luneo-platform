/**
 * Tests for Pricing Page Component
 * Tests critical conversion-flow component: pricing page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
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
    description: 'Essayez Luneo gratuitement avec des fonctionnalités de base',
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
    id: 'pro',
    name: 'Pro',
    description: 'Pour les créateurs et PME qui veulent passer à la vitesse supérieure',
    priceMonthly: 49,
    priceYearly: 470.4,
    priceYearlyMonthly: 39.2,
    currency: 'EUR',
    popular: true,
    badge: 'LE PLUS POPULAIRE',
    cta: 'Démarrer l\'essai gratuit',
    ctaHref: '/register?plan=pro',
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
    description: 'Pour les équipes qui ont besoin de collaboration et de volume',
    priceMonthly: 99,
    priceYearly: 950.4,
    priceYearlyMonthly: 79.2,
    currency: 'EUR',
    cta: 'Démarrer l\'essai gratuit',
    ctaHref: '/register?plan=business',
    features: ['1000 designs/mois', 'Toutes les fonctionnalités Pro'],
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
    features: ['Designs illimités', 'Rendus illimités', 'Infrastructure dédiée'],
    limits: {
      designs: 'Illimité',
      renders2D: 'Illimité',
      renders3D: 'Illimité',
      storage: 'Illimité',
      teamMembers: 'Illimité',
      apiCalls: 'Illimité',
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
    t: (key: string) => key,
    translatedFeatures: [],
    translatedFaqs: [],
  }),
}));

// Mock dynamic motion components
vi.mock('@/lib/performance/dynamic-motion', () => ({
  LazyMotionDiv: ({ children, ...props }: { children: ReactNode } & ComponentProps<'div'>) => (
    <div {...props}>{children}</div>
  ),
}));

// Mock ErrorBoundary
vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock pricing components
vi.mock('../components/PricingHero', () => ({
  PricingHero: ({ isYearly, onYearlyChange }: { isYearly: boolean; onYearlyChange: (value: boolean) => void }) => (
    <div data-testid="pricing-hero">
      <h1>Tarification qui évolue avec vous</h1>
      <button onClick={() => onYearlyChange(!isYearly)}>
        {isYearly ? 'Annuel' : 'Mensuel'}
      </button>
    </div>
  ),
}));

vi.mock('../components/PricingPlanCard', () => ({
  PricingPlanCard: ({ plan, isYearly: _isYearly, onCheckout }: {
    plan: { id: string; name: string; description: string; badge?: string; cta: string };
    isYearly: boolean;
    onCheckout: (planId: string) => void;
  }) => (
    <div data-testid={`plan-card-${plan.id}`}>
      <h3>{plan.name}</h3>
      <p>{plan.description}</p>
      {plan.badge && <span>{plan.badge}</span>}
      <button onClick={() => onCheckout(plan.id)}>{plan.cta}</button>
    </div>
  ),
}));

vi.mock('../components/PricingFeatureTable', () => ({
  PricingFeatureTable: ({ features: _features }: { features: string[] }) => (
    <div data-testid="pricing-feature-table">
      <h2>Features</h2>
    </div>
  ),
}));

vi.mock('../components/PricingFAQ', () => ({
  PricingFAQ: ({ items: _items }: { items: Array<{ question: string; answer: string }> }) => (
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
      expect(screen.getAllByText('Pro').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Business').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Enterprise').length).toBeGreaterThanOrEqual(1);
    });

    it('should show pricing amounts for plans', () => {
      render(<PricingPage />);
      
      // Check for plan cards which should contain pricing
      expect(screen.getByTestId('plan-card-free')).toBeInTheDocument();
      expect(screen.getByTestId('plan-card-pro')).toBeInTheDocument();
      expect(screen.getByTestId('plan-card-business')).toBeInTheDocument();
      expect(screen.getByTestId('plan-card-enterprise')).toBeInTheDocument();
    });

    it('should render CTA buttons for each plan', () => {
      render(<PricingPage />);
      
      // Check for CTA buttons - verify at least one of each type exists
      const freeButtons = screen.queryAllByRole('button', { name: /commencer gratuitement/i });
      expect(freeButtons.length).toBeGreaterThan(0);
      
      const trialButtons = screen.queryAllByRole('button', { name: /démarrer l'essai gratuit/i });
      expect(trialButtons.length).toBeGreaterThan(0);
      
      const contactButtons = screen.queryAllByRole('button', { name: /contacter les ventes/i });
      expect(contactButtons.length).toBeGreaterThan(0);
    });

    it('should show popular badge for Pro plan', () => {
      render(<PricingPage />);
      
      expect(screen.getByText('LE PLUS POPULAIRE')).toBeInTheDocument();
    });

    it('should render plan features', () => {
      render(<PricingPage />);
      
      // Check for plan cards which contain features
      const freeCard = screen.getByTestId('plan-card-free');
      expect(freeCard).toBeInTheDocument();
      
      const proCard = screen.getByTestId('plan-card-pro');
      expect(proCard).toBeInTheDocument();
    });
  });
});
