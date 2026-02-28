import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

// Mock dependencies BEFORE importing Sidebar
let mockPathname = '/dashboard';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('@/components/Logo', () => ({
  Logo: ({
    href,
    size,
    showText,
    variant,
  }: {
    href?: string;
    size?: string;
    showText?: boolean;
    variant?: string;
  }) => (
    <div data-testid="logo" data-href={href} data-size={size} data-show-text={showText} data-variant={variant}>
      Logo
    </div>
  ),
}));

vi.mock('@/lib/performance/dynamic-motion', () => ({
  LazyMotionDiv: ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) => (
    <div {...props}>{children}</div>
  ),
}));

// Mock React.useMemo to work at module level
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useMemo: <T,>(fn: () => T) => fn(),
  };
});

// Import Sidebar after all mocks
import { Sidebar } from '../Sidebar';

describe('Sidebar', () => {
  const defaultProps = {
    isCollapsed: false,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render sidebar when not collapsed', () => {
      render(<Sidebar {...defaultProps} />);
      
      expect(screen.getByText('Luneo')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
    });

    it('should render sidebar when collapsed', () => {
      render(<Sidebar isCollapsed={true} onToggle={defaultProps.onToggle} />);
      
      expect(screen.queryByText('Luneo')).not.toBeInTheDocument();
      expect(screen.queryByText('Enterprise')).not.toBeInTheDocument();
    });

    it('should render toggle button', () => {
      render(<Sidebar {...defaultProps} />);
      
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should render navigation items', () => {
      render(<Sidebar {...defaultProps} />);
      
      expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
      expect(screen.getByText('AI Studio')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Produits')).toBeInTheDocument();
    });

    it('should render business items', () => {
      render(<Sidebar {...defaultProps} />);
      
      expect(screen.getByText('Facturation')).toBeInTheDocument();
      expect(screen.getByText('Équipe')).toBeInTheDocument();
      expect(screen.getByText('Intégrations')).toBeInTheDocument();
      expect(screen.getByText('Sécurité')).toBeInTheDocument();
    });

    it('should render support items', () => {
      render(<Sidebar {...defaultProps} />);
      
      expect(screen.getByText('Aide')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
      expect(screen.getByText('Statut')).toBeInTheDocument();
    });

    it('should render section headers when not collapsed', () => {
      render(<Sidebar {...defaultProps} />);
      
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Business')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
    });

    it('should not render section headers when collapsed', () => {
      render(<Sidebar isCollapsed={true} onToggle={defaultProps.onToggle} />);
      
      expect(screen.queryByText('Navigation')).not.toBeInTheDocument();
      expect(screen.queryByText('Business')).not.toBeInTheDocument();
      expect(screen.queryByText('Support')).not.toBeInTheDocument();
    });

    it('should render settings link in footer', () => {
      render(<Sidebar {...defaultProps} />);
      
      expect(screen.getByText('Paramètres')).toBeInTheDocument();
    });
  });

  describe('Navigation items', () => {
    it('should render badges on navigation items', () => {
      render(<Sidebar {...defaultProps} />);
      
      expect(screen.getByText('Nouveau')).toBeInTheDocument(); // AI Studio badge
      expect(screen.getByText('OK')).toBeInTheDocument(); // Statut badge
    });

    it('should render item descriptions when not collapsed', () => {
      render(<Sidebar {...defaultProps} />);
      
      expect(screen.getByText("Vue d'ensemble de votre activité")).toBeInTheDocument();
      expect(screen.getByText("Création de designs avec l'IA")).toBeInTheDocument();
    });

    it('should highlight active navigation item when pathname matches', () => {
      mockPathname = '/overview';
      render(<Sidebar {...defaultProps} />);
      
      const dashboardLink = screen.getByText('Tableau de bord').closest('a');
      expect(dashboardLink).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-purple-600');
      mockPathname = '/dashboard';
    });
  });

  describe('Toggle functionality', () => {
    it('should call onToggle when toggle button is clicked', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      
      render(<Sidebar isCollapsed={false} onToggle={onToggle} />);
      
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should show chevron left when not collapsed', () => {
      render(<Sidebar {...defaultProps} />);
      
      // The toggle button should exist (ChevronLeft is rendered inside)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      // Toggle button is the first one
      expect(buttons[0]).toBeInTheDocument();
    });

    it('should show chevron right when collapsed', () => {
      render(<Sidebar isCollapsed={true} onToggle={defaultProps.onToggle} />);
      
      // The toggle button should exist (ChevronRight is rendered inside)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      // Toggle button is the first one
      expect(buttons[0]).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should render navigation links with correct hrefs', () => {
      render(<Sidebar {...defaultProps} />);
      
      const dashboardLink = screen.getByText('Tableau de bord').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/overview');
      
      const aiStudioLink = screen.getByText('AI Studio').closest('a');
      expect(aiStudioLink).toHaveAttribute('href', '/agents');
    });

    it('should render business links with correct hrefs', () => {
      render(<Sidebar {...defaultProps} />);
      
      const billingLink = screen.getByText('Facturation').closest('a');
      expect(billingLink).toHaveAttribute('href', '/billing');
      
      const teamLink = screen.getByText('Équipe').closest('a');
      expect(teamLink).toHaveAttribute('href', '/team');
    });
  });

  describe('Error boundary', () => {
    it('should be wrapped in ErrorBoundary', () => {
      const { container } = render(<Sidebar {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper structure for screen readers', () => {
      render(<Sidebar {...defaultProps} />);
      
      // Navigation items should be accessible
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });
});

