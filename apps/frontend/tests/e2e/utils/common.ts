/**
 * Helpers E2E communs - Fonctions réutilisables pour les tests E2E
 */

import { Page } from '@playwright/test';

/**
 * Attend que la page soit complètement chargée et prête
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Génère un email unique pour les tests
 */
export function generateTestEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).substring(7)}@test-luneo.app`;
}

/**
 * Génère un nom unique pour les tests
 */
export function generateTestName(): string {
  return `Test User ${Date.now()}`;
}

/**
 * Vérifie qu'un élément est visible avec timeout
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Vérifie qu'un élément contient du texte
 */
export async function waitForText(
  page: Page,
  text: string | RegExp,
  timeout = 5000
): Promise<boolean> {
  try {
    await page.waitForSelector(`text=${text}`, { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Clique sur un élément avec retry
 */
export async function clickWithRetry(
  page: Page,
  selector: string,
  maxRetries = 3
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.click(selector, { timeout: 2000 });
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Remplit un formulaire avec retry
 */
export async function fillFormField(
  page: Page,
  selector: string,
  value: string,
  maxRetries = 3
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.fill(selector, value, { timeout: 2000 });
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Prend une capture d'écran avec nom automatique
 */
export async function takeScreenshot(
  page: Page,
  name: string
): Promise<void> {
  await page.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Vérifie qu'il n'y a pas d'erreurs console critiques
 */
export async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignorer certaines erreurs communes
      if (
        !text.includes('favicon') &&
        !text.includes('sourcemap') &&
        !text.includes('404')
      ) {
        errors.push(text);
      }
    }
  });
  
  return errors;
}

/**
 * Attend qu'une requête API soit complétée
 */
export async function waitForAPIRequest(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Vérifie qu'une page est accessible (pas de 404/500)
 */
export async function verifyPageAccessible(page: Page): Promise<boolean> {
  const statusCode = page.url().includes('localhost') ? 200 : null;
  
  // Vérifier qu'il n'y a pas de message d'erreur
  const errorMessages = [
    page.getByText(/404|not found/i),
    page.getByText(/500|server error/i),
    page.getByText(/error|erreur/i),
  ];
  
  for (const errorMsg of errorMessages) {
    const isVisible = await errorMsg.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      return false;
    }
  }
  
  return true;
}








