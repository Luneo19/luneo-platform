/**
 * Fixtures personnalisées pour les tests Playwright
 * Ces fixtures étendent les fonctionnalités de base de Playwright
 */

import { test as base, expect, Page } from '@playwright/test';

// Types pour les fixtures
interface CustomFixtures {
  /** Page avec la bannière de cookies acceptée */
  cleanPage: Page;
  /** Effectue une action et attend que le réseau soit idle */
  waitForNetworkIdle: (action: () => Promise<void>) => Promise<void>;
  /** Prend un screenshot avec un nom formaté */
  takeNamedScreenshot: (name: string) => Promise<void>;
}

// Export de test avec les fixtures personnalisées
export const test = base.extend<CustomFixtures>({
  // Page avec cookies acceptés
  cleanPage: async ({ page }, use) => {
    await page.goto('/');
    
    // Accepter les cookies si la bannière est présente
    const cookieBanner = page.getByRole('button', { name: /accepter|accept/i });
    if (await cookieBanner.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieBanner.click();
      await page.waitForTimeout(500);
    }
    
    await use(page);
  },
  
  // Attendre que le réseau soit idle après une action
  waitForNetworkIdle: async ({ page }, use) => {
    await use(async (action: () => Promise<void>) => {
      await Promise.all([
        page.waitForLoadState('networkidle'),
        action(),
      ]);
    });
  },
  
  // Screenshot avec nom formaté
  takeNamedScreenshot: async ({ page }, use) => {
    await use(async (name: string) => {
      const sanitizedName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await page.screenshot({ 
        path: `test-results/screenshots/${sanitizedName}-${timestamp}.png`,
        fullPage: true 
      });
    });
  },
});

// Export expect pour utilisation dans les tests
export { expect };

// ============================================
// PAGE OBJECT MODELS (POMs)
// ============================================

/**
 * Page Object pour la page de Login
 */
export class LoginPage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }
  
  async fillEmail(email: string) {
    await this.page.getByTestId('login-email').fill(email);
  }
  
  async fillPassword(password: string) {
    await this.page.getByTestId('login-password').fill(password);
  }
  
  async submit() {
    await this.page.getByTestId('login-submit').click();
  }
  
  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }
  
  async expectError(message: RegExp | string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}

/**
 * Page Object pour la page de Register
 */
export class RegisterPage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');
  }
  
  async fillForm(data: { name?: string; email: string; password: string }) {
    if (data.name) {
      await this.page.getByTestId('register-name').fill(data.name);
    }
    await this.page.getByTestId('register-email').fill(data.email);
    await this.page.getByTestId('register-password').fill(data.password);
  }
  
  async submit() {
    await this.page.getByTestId('register-submit').click();
  }
  
  async register(data: { name?: string; email: string; password: string }) {
    await this.fillForm(data);
    await this.submit();
  }
}

/**
 * Page Object pour la page Pricing
 */
export class PricingPage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/pricing');
    await this.page.waitForLoadState('networkidle');
  }
  
  async selectPlan(planName: string) {
    await this.page.getByRole('button', { name: new RegExp(planName, 'i') }).click();
  }
  
  async toggleAnnualBilling() {
    await this.page.getByRole('switch').click();
  }
  
  async expectPlansVisible() {
    await expect(this.page.getByText(/starter/i)).toBeVisible();
    await expect(this.page.getByText(/professional/i)).toBeVisible();
    await expect(this.page.getByText(/business/i)).toBeVisible();
  }
}

/**
 * Page Object pour le Dashboard
 */
export class DashboardPage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }
  
  async expectLoaded() {
    await expect(this.page.getByText(/dashboard|tableau de bord/i).first()).toBeVisible();
  }
  
  async navigateTo(section: 'designs' | 'analytics' | 'settings' | 'billing' | 'support') {
    await this.page.getByRole('link', { name: new RegExp(section, 'i') }).click();
    await this.page.waitForLoadState('networkidle');
  }
}

// ============================================
// HELPERS UTILITAIRES
// ============================================

/**
 * Attendre qu'un toast apparaisse et disparaisse
 */
export async function waitForToast(page: Page, text: RegExp | string) {
  await expect(page.getByText(text)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(text)).toBeHidden({ timeout: 10000 });
}

/**
 * Remplir un formulaire générique
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [selector, value] of Object.entries(fields)) {
    const element = page.locator(selector);
    await element.fill(value);
  }
}

/**
 * Vérifier que la page ne contient pas d'erreurs console critiques
 */
export async function expectNoConsoleErrors(page: Page) {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Attendre un peu pour capturer les erreurs
  await page.waitForTimeout(1000);
  
  // Filtrer les erreurs non critiques
  const criticalErrors = errors.filter((e) => 
    !e.includes('favicon') && 
    !e.includes('hydration') &&
    !e.includes('Warning:')
  );
  
  expect(criticalErrors).toHaveLength(0);
}

