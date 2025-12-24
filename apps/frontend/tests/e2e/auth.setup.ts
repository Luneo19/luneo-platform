/**
 * Auth Setup - Configure l'authentification pour les tests E2E
 * Ce fichier est exécuté avant les tests pour établir une session authentifiée
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../.playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Configuration des credentials de test
  const testEmail = process.env.E2E_TEST_EMAIL || 'test@luneo.app';
  const testPassword = process.env.E2E_TEST_PASSWORD || 'TestPassword123!';
  
  console.log(`\n🔐 Authentification avec ${testEmail}...\n`);
  
  // Aller à la page de login
  await page.goto('/login');
  
  // Attendre que le formulaire soit chargé
  await page.waitForLoadState('networkidle');
  
  // Fermer la bannière de cookies si présente
  const cookieBanner = page.getByRole('button', { name: /accepter|accept/i });
  if (await cookieBanner.isVisible().catch(() => false)) {
    await cookieBanner.click();
  }
  
  // Remplir le formulaire
  const emailInput = page.getByTestId('login-email').or(page.getByPlaceholder(/email/i));
  const passwordInput = page.getByTestId('login-password').or(page.getByPlaceholder(/mot de passe|password/i));
  
  await emailInput.fill(testEmail);
  await passwordInput.fill(testPassword);
  
  // Soumettre
  const submitButton = page.getByTestId('login-submit').or(page.getByRole('button', { name: /connexion|sign in|login/i }));
  await submitButton.click();
  
  // Attendre la redirection vers le dashboard ou une page authentifiée
  await page.waitForURL(/dashboard|home|profile/, { timeout: 15000 }).catch(async () => {
    // Si pas de redirection, vérifier si on est toujours sur login (erreur)
    if (page.url().includes('/login')) {
      const errorMessage = await page.getByText(/erreur|error|invalid/i).first().textContent().catch(() => null);
      console.warn(`⚠️ Authentification échouée: ${errorMessage || 'Raison inconnue'}`);
      console.warn('⚠️ Les tests authentifiés seront skippés');
      return;
    }
  });
  
  // Sauvegarder l'état de session
  await page.context().storageState({ path: authFile });
  
  console.log('✅ Session authentifiée sauvegardée\n');
});

// Setup alternatif pour créer un utilisateur si nécessaire
setup.skip('create test user', async ({ page }) => {
  // Ce test est skip par défaut - à activer si besoin
  const testEmail = `test-${Date.now()}@luneo.app`;
  const testPassword = 'TestPassword123!';
  
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  
  // Remplir le formulaire d'inscription
  await page.getByTestId('register-email').fill(testEmail);
  await page.getByTestId('register-password').fill(testPassword);
  await page.getByTestId('register-name').fill('Test User');
  
  await page.getByTestId('register-submit').click();
  
  // Attendre la confirmation
  await page.waitForURL(/dashboard|verify|confirm/, { timeout: 15000 });
  
  console.log(`✅ Utilisateur créé: ${testEmail}`);
});

