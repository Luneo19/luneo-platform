/**
 * E2E Tests: Authentication Flow
 * T-016, T-017: Tests inscription et connexion
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Registration', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');
      
      await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible();
      await expect(page.getByLabel(/nom complet/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/mot de passe/i).first()).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/register');
      
      await page.getByRole('button', { name: /créer mon compte/i }).click();
      
      await expect(page.getByText(/nom est requis/i)).toBeVisible();
    });

    test('should show password requirements', async ({ page }) => {
      await page.goto('/register');
      
      const passwordInput = page.getByLabel(/mot de passe/i).first();
      await passwordInput.fill('weak');
      
      await expect(page.getByText(/au moins 8 caractères/i)).toBeVisible();
    });

    test('should successfully register with valid data', async ({ page }) => {
      await page.goto('/register');
      
      const uniqueEmail = `test-${Date.now()}@example.com`;
      
      await page.getByLabel(/nom complet/i).fill('Test User');
      await page.getByLabel(/email/i).fill(uniqueEmail);
      await page.getByLabel(/mot de passe/i).first().fill('SecurePass123!');
      await page.getByLabel(/confirmer/i).fill('SecurePass123!');
      await page.getByLabel(/j'accepte/i).check();
      
      await page.getByRole('button', { name: /créer mon compte/i }).click();
      
      // Should redirect to dashboard or show success
      await expect(page).toHaveURL(/dashboard|verify|success/i, { timeout: 10000 });
    });

    test('should have link to login page', async ({ page }) => {
      await page.goto('/register');
      
      await page.getByRole('link', { name: /se connecter/i }).click();
      
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Login', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.getByRole('heading', { name: /connexion|bienvenue/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.getByLabel(/email/i).fill('invalid@example.com');
      await page.getByLabel(/mot de passe/i).fill('wrongpassword');
      await page.getByRole('button', { name: /se connecter/i }).click();
      
      await expect(page.getByText(/invalide|incorrect|erreur/i)).toBeVisible({ timeout: 5000 });
    });

    test('should have OAuth buttons', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
    });

    test('should have forgot password link', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.getByRole('link', { name: /mot de passe oublié/i })).toBeVisible();
    });

    test('should have link to register page', async ({ page }) => {
      await page.goto('/login');
      
      await page.getByRole('link', { name: /s'inscrire|créer/i }).click();
      
      await expect(page).toHaveURL('/register');
    });
  });

  test.describe('Password Reset', () => {
    test('should display reset form', async ({ page }) => {
      await page.goto('/forgot-password');
      
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /envoyer|réinitialiser/i })).toBeVisible();
    });

    test('should show success message after submit', async ({ page }) => {
      await page.goto('/forgot-password');
      
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByRole('button', { name: /envoyer|réinitialiser/i }).click();
      
      await expect(page.getByText(/email envoyé|vérifiez|boîte/i)).toBeVisible({ timeout: 5000 });
    });
  });
});


