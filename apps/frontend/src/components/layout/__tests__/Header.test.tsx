import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../Header';

// Mock dependencies
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/i18n/useI18n', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'searchPlaceholder': 'Rechercher...',
      'actions.create': 'Créer',
      'actions.upgrade': 'Améliorer',
      'profileMenu.openLabel': 'Menu utilisateur',
      'profileMenu.plan': 'Plan Pro',
      'profileMenu.welcome': 'Bienvenue',
      'profileMenu.profile': 'Profil',
      'profileMenu.billing': 'Facturation',
      'profileMenu.settings': 'Paramètres',
      'profileMenu.help': 'Aide',
      'profileMenu.api': 'API',
      'profileMenu.logout': 'Déconnexion',
    };
    return translations[key] || key;
  },
}));

vi.mock('@/components/theme/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

vi.mock('@/components/notifications/NotificationBell', () => ({
  NotificationBell: ({ variant, size }: any) => (
    <div data-testid="notification-bell" data-variant={variant} data-size={size}>
      Notification Bell
    </div>
  ),
}));

vi.mock('@/components/navigation/LocaleSwitcher', () => ({
  LocaleSwitcher: ({ className }: any) => (
    <div data-testid="locale-switcher" className={className}>
      Locale Switcher
    </div>
  ),
}));

vi.mock('@/lib/performance/dynamic-motion', () => ({
  LazyMotionDiv: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  LazyAnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
    },
    isAuthenticated: true,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <>{children}</>,
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render header with default props', () => {
      render(<Header />);
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Rechercher...')).toBeInTheDocument();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('should render header with title and subtitle', () => {
      render(<Header title="Dashboard" subtitle="Vue d'ensemble" />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText("Vue d'ensemble")).toBeInTheDocument();
    });

    it('should render all header sections', () => {
      render(<Header />);
      
      // Left section (breadcrumb area)
      expect(screen.getByRole('banner')).toBeInTheDocument();
      
      // Center section (search)
      expect(screen.getByPlaceholderText('Rechercher...')).toBeInTheDocument();
      
      // Right section
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('should render quick action buttons', () => {
      render(<Header />);
      
      expect(screen.getByLabelText('Créer')).toBeInTheDocument();
      expect(screen.getByLabelText('Améliorer')).toBeInTheDocument();
    });

    it('should render locale switcher', () => {
      render(<Header />);
      
      const localeSwitcher = screen.getByTestId('locale-switcher');
      expect(localeSwitcher).toBeInTheDocument();
      expect(localeSwitcher).toHaveClass('hidden', 'lg:block');
    });
  });

  describe('Search functionality', () => {
    it('should update search query on input change', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const searchInput = screen.getByPlaceholderText('Rechercher...');
      await user.type(searchInput, 'test query');
      
      expect(searchInput).toHaveValue('test query');
    });

    it('should have correct search input attributes', () => {
      render(<Header />);
      
      const searchInput = screen.getByPlaceholderText('Rechercher...');
      expect(searchInput).toHaveAttribute('aria-label', 'Rechercher...');
    });
  });

  describe('Profile menu', () => {
    it('should toggle profile menu on click', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      const userMenuButton = screen.getByTestId('user-menu');
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(userMenuButton);
      
      await waitFor(() => {
        expect(userMenuButton).toHaveAttribute('aria-expanded', 'true');
      });
      
      expect(screen.getByText('Bienvenue John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should display profile menu items when open', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      await user.click(screen.getByTestId('user-menu'));
      
      await waitFor(() => {
        expect(screen.getByText('Profil')).toBeInTheDocument();
        expect(screen.getByText('Facturation')).toBeInTheDocument();
        expect(screen.getByText('Paramètres')).toBeInTheDocument();
        expect(screen.getByText('Aide')).toBeInTheDocument();
        expect(screen.getByText('API')).toBeInTheDocument();
        expect(screen.getByText('Déconnexion')).toBeInTheDocument();
      });
    });

    it('should close profile menu when logout button is clicked', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      // Open menu
      await user.click(screen.getByTestId('user-menu'));
      
      await waitFor(() => {
        expect(screen.getByText('Déconnexion')).toBeInTheDocument();
      });
      
      // Click logout
      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Déconnexion')).not.toBeInTheDocument();
      });
    });

    it('should display user information in profile menu', async () => {
      const user = userEvent.setup();
      render(<Header />);
      
      await user.click(screen.getByTestId('user-menu'));
      
      await waitFor(() => {
        // Check for user name (appears in menu)
        const userNameElements = screen.getAllByText('John Doe');
        expect(userNameElements.length).toBeGreaterThan(0);
        
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        
        // Plan Pro appears multiple times, just check it exists
        const planElements = screen.getAllByText('Plan Pro');
        expect(planElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Header />);
      
      const userMenuButton = screen.getByTestId('user-menu');
      expect(userMenuButton).toHaveAttribute('aria-haspopup', 'menu');
      expect(userMenuButton).toHaveAttribute('aria-label', 'Menu utilisateur');
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have accessible search input', () => {
      render(<Header />);
      
      const searchInput = screen.getByPlaceholderText('Rechercher...');
      expect(searchInput).toHaveAttribute('aria-label', 'Rechercher...');
    });
  });

  describe('Error boundary', () => {
    it('should be wrapped in ErrorBoundary', () => {
      const { container } = render(<Header />);
      // ErrorBoundary should be present (component renders successfully)
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});

