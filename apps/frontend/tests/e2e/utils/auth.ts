import { Page } from '@playwright/test';

/**
 * Utilitaires pour l'authentification dans les tests E2E
 */

export interface TestUser {
  email: string;
  password: string;
}

/**
 * Utilisateur de test par défaut
 * ⚠️ À configurer avec un compte de test réel ou utiliser des variables d'environnement
 */
export const TEST_USER: TestUser = {
  email: process.env.E2E_TEST_EMAIL || 'test@luneo.app',
  password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!',
};

/**
 * Connecte un utilisateur dans l'application
 */
export async function loginUser(page: Page, user: TestUser = TEST_USER): Promise<void> {
  await page.goto('/login');
  
  // Attendre que le formulaire soit visible
  await page.waitForSelector('[data-testid="login-email"]', { timeout: 10000 });
  
  // Remplir le formulaire
  await page.fill('[data-testid="login-email"]', user.email);
  await page.fill('[data-testid="login-password"]', user.password);
  
  // Soumettre
  await page.click('[data-testid="login-submit"]');
  
  // Attendre la redirection vers le dashboard
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });
}

/**
 * Déconnecte l'utilisateur
 */
export async function logoutUser(page: Page): Promise<void> {
  // Chercher le bouton de déconnexion
  const logoutButton = page.getByRole('button', { name: /déconnexion|logout|sign out/i }).first();
  
  if (await logoutButton.isVisible().catch(() => false)) {
    await logoutButton.click();
    await page.waitForURL(/.*login/, { timeout: 10000 });
  } else {
    // Si pas de bouton visible, aller directement à /logout
    await page.goto('/logout');
  }
}

/**
 * Vérifie si l'utilisateur est connecté
 */
export async function isUserLoggedIn(page: Page): Promise<boolean> {
  // Vérifier la présence d'éléments du dashboard
  const dashboardElements = [
    page.getByText(/dashboard|tableau de bord/i).first(),
    page.getByRole('link', { name: /profil|profile|settings/i }).first(),
  ];

  for (const element of dashboardElements) {
    if (await element.isVisible().catch(() => false)) {
      return true;
    }
  }

  // Vérifier l'URL
  const url = page.url();
  return url.includes('/dashboard') || url.includes('/settings');
}

/**
 * Crée un utilisateur de test (si l'API le permet)
 */
export async function createTestUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/register');
  
  await page.waitForSelector('[data-testid="register-email"]', { timeout: 10000 });
  
  await page.fill('[data-testid="register-email"]', user.email);
  await page.fill('[data-testid="register-password"]', user.password);
  
  // Remplir les autres champs si nécessaires
  const nameField = page.locator('[data-testid="register-name"]').first();
  if (await nameField.isVisible().catch(() => false)) {
    await nameField.fill('Test User');
  }
  
  await page.click('[data-testid="register-submit"]');
  
  // Attendre la création ou la redirection
  await page.waitForTimeout(2000);
}

/**
 * Nettoie les données de test (à implémenter selon vos besoins)
 */
export async function cleanupTestData(page: Page): Promise<void> {
  // À implémenter selon votre logique de nettoyage
  // Par exemple, supprimer les designs de test, etc.
  console.log('Cleanup test data - À implémenter');
}

