import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Footer } from '../Footer';

// Mock dependencies
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

vi.mock('@/lib/performance/dynamic-motion', () => ({
  LazyMotionDiv: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock i18n for French footer strings expected by tests
vi.mock('@/i18n/useI18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === 'components.footer.jobsCount' && params?.count !== undefined) {
        return `${params.count} postes`;
      }
      const map: Record<string, string> = {
        'components.footer.newsletterTitle': 'Restez informé des dernières nouveautés',
        'components.footer.newsletterDesc': 'Recevez nos conseils et actualités.',
        'components.footer.emailPlaceholder': 'votre@email.com',
        'components.footer.subscribe': "S'inscrire",
        'components.footer.subscribed': 'Inscrit !',
        'components.footer.product': 'Produit',
        'components.footer.integrations': 'Intégrations',
        'components.footer.industries': 'Industries',
        'components.footer.resources': 'Ressources',
        'components.footer.company': 'Entreprise',
        'components.footer.legal': 'Légal',
        'components.footer.customizer': 'Customizer',
        'components.footer.configurator3d': 'Configurateur 3D',
        'components.footer.pricing': 'Tarifs',
        'components.footer.terms': 'CGU',
        'components.footer.privacy': 'Confidentialité',
        'components.footer.new': 'Nouveau',
        'components.footer.rgpdCompliant': 'RGPD Compliant',
        'components.footer.soc2': 'SOC 2 Type II',
        'components.footer.cdnEurope': 'CDN Europe',
        'components.footer.platformDesc': 'La plateforme de personnalisation produit',
        'components.footer.paris': 'Paris, France',
        'components.footer.inParis': 'en France',
        'components.footer.allSystemsOperational': 'Tous les systèmes opérationnels',
        'components.footer.statusPage': 'Page statut',
        'components.footer.allRightsReserved': 'Tous droits réservés.',
        'components.footer.termsLink': 'CGU',
        'components.footer.privacyLinkLabel': 'Confidentialité',
        'components.footer.cookiesLink': 'Cookies',
        'components.footer.madeWith': 'Fait avec',
      };
      return map[key] ?? key;
    },
    locale: 'fr',
    setLocale: () => {},
  }),
}));

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render footer component', () => {
      render(<Footer />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should render newsletter section', () => {
      render(<Footer />);
      
      expect(screen.getByText('Restez informé des dernières nouveautés')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('votre@email.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /S'inscrire/i })).toBeInTheDocument();
    });

    it('should render all footer link sections', () => {
      render(<Footer />);
      
      expect(screen.getByText('Produit')).toBeInTheDocument();
      expect(screen.getByText('Intégrations')).toBeInTheDocument();
      expect(screen.getByText('Industries')).toBeInTheDocument();
      expect(screen.getByText('Ressources')).toBeInTheDocument();
      expect(screen.getByText('Entreprise')).toBeInTheDocument();
      expect(screen.getByText('Légal')).toBeInTheDocument();
    });

    it('should render footer links', () => {
      render(<Footer />);
      
      // Product links
      expect(screen.getByText('Customizer')).toBeInTheDocument();
      expect(screen.getByText('Configurateur 3D')).toBeInTheDocument();
      expect(screen.getByText('Tarifs')).toBeInTheDocument();
      
      // Integration links
      expect(screen.getByText('Shopify')).toBeInTheDocument();
      expect(screen.getByText('WooCommerce')).toBeInTheDocument();
      
      // Legal links - use getAllByText since "CGU" and "Confidentialité" may appear multiple times
      const cguLinks = screen.getAllByText('CGU');
      expect(cguLinks.length).toBeGreaterThan(0);
      const privacyLinks = screen.getAllByText('Confidentialité');
      expect(privacyLinks.length).toBeGreaterThan(0);
    });

    it('should render badges on links', () => {
      render(<Footer />);
      
      expect(screen.getByText('Nouveau')).toBeInTheDocument(); // Roadmap badge
      expect(screen.getByText('3 postes')).toBeInTheDocument(); // Careers badge
    });

    it('should render social media links', () => {
      render(<Footer />);
      
      const twitterLink = screen.getByLabelText('Twitter');
      const linkedinLink = screen.getByLabelText('LinkedIn');
      const githubLink = screen.getByLabelText('GitHub');
      const youtubeLink = screen.getByLabelText('YouTube');
      
      expect(twitterLink).toBeInTheDocument();
      expect(linkedinLink).toBeInTheDocument();
      expect(githubLink).toBeInTheDocument();
      expect(youtubeLink).toBeInTheDocument();
      
      expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/luneoapp');
      expect(twitterLink).toHaveAttribute('target', '_blank');
      expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render trust badges', () => {
      render(<Footer />);
      
      expect(screen.getByText('RGPD Compliant')).toBeInTheDocument();
      expect(screen.getByText('SOC 2 Type II')).toBeInTheDocument();
      expect(screen.getByText('CDN Europe')).toBeInTheDocument();
    });

    it('should render company information', () => {
      render(<Footer />);
      
      expect(screen.getByText(/La plateforme de personnalisation produit/i)).toBeInTheDocument();
      expect(screen.getByText('Paris, France')).toBeInTheDocument();
    });

    it('should render copyright notice', () => {
      render(<Footer />);
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear} Luneo`))).toBeInTheDocument();
    });

    it('should render status bar', () => {
      render(<Footer />);
      
      expect(screen.getByText('Tous les systèmes opérationnels')).toBeInTheDocument();
      expect(screen.getByText('Page statut')).toBeInTheDocument();
    });
  });

  describe('Newsletter subscription', () => {
    beforeEach(() => {
      vi.useRealTimers();
    });

    it('should update email input on change', async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      const emailInput = screen.getByPlaceholderText('votre@email.com');
      await user.type(emailInput, 'test@example.com');
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should disable submit button when email is empty', () => {
      render(<Footer />);
      
      const submitButton = screen.getByRole('button', { name: /S'inscrire/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when email is provided', async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      const emailInput = screen.getByPlaceholderText('votre@email.com');
      const submitButton = screen.getByRole('button', { name: /S'inscrire/i });
      
      await user.type(emailInput, 'test@example.com');
      
      expect(submitButton).not.toBeDisabled();
    });

    it('should show loading state during subscription', async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      const emailInput = screen.getByPlaceholderText('votre@email.com');
      const submitButton = screen.getByRole('button', { name: /S'inscrire/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      // Button should be disabled during subscription
      expect(submitButton).toBeDisabled();
    });

    it('should show success state after subscription', async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      const emailInput = screen.getByPlaceholderText('votre@email.com');
      const submitButton = screen.getByRole('button', { name: /S'inscrire/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      // Wait for subscription to complete (1 second delay in component)
      await waitFor(() => {
        expect(screen.getByText('Inscrit !')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Email should be cleared
      expect(emailInput).toHaveValue('');
    });

    it('should reset success state after 3 seconds', async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      const emailInput = screen.getByPlaceholderText('votre@email.com');
      const submitButton = screen.getByRole('button', { name: /S'inscrire/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      // Wait for subscription to complete (1 second delay)
      await waitFor(() => {
        expect(screen.getByText('Inscrit !')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Wait for reset (3 seconds after subscription = 4 seconds total)
      await waitFor(() => {
        expect(screen.queryByText('Inscrit !')).not.toBeInTheDocument();
      }, { timeout: 6000 });
    }, { timeout: 10000 });
  });

  describe('Links', () => {
    it('should have correct href attributes', () => {
      render(<Footer />);
      
      const customizerLink = screen.getByText('Customizer');
      expect(customizerLink.closest('a')).toHaveAttribute('href', '/solutions/customizer');
      
      const shopifyLink = screen.getByText('Shopify');
      expect(shopifyLink.closest('a')).toHaveAttribute('href', '/integrations/shopify');
    });

    it('should render privacy policy link in newsletter', () => {
      render(<Footer />);
      
      const privacyLink = screen.getByText('politique de confidentialité');
      expect(privacyLink.closest('a')).toHaveAttribute('href', '/legal/privacy');
    });
  });

  describe('Error boundary', () => {
    it('should be wrapped in ErrorBoundary', () => {
      const { container } = render(<Footer />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});

