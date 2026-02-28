import { type Locator, type Page } from '@playwright/test';

const SUPPORTED_LOCALES = ['en', 'fr', 'de'] as const;
export type SupportedTestLocale = (typeof SUPPORTED_LOCALES)[number];

async function safeIsVisible(locator: Locator): Promise<boolean> {
  try {
    return (await locator.count()) > 0 && (await locator.first().isVisible());
  } catch {
    return false;
  }
}

/**
 * Définit la locale de la page en ajoutant un paramètre de query
 * Cette fonction est tolérante aux erreurs pour éviter les échecs flaky
 */
export async function setLocale(page: Page, locale: SupportedTestLocale): Promise<void> {
  // On stocke juste la locale dans le contexte sans faire de navigation
  // Les tests navigueront eux-mêmes vers les pages nécessaires
  await page.addInitScript((loc) => {
    // Définir la locale dans localStorage pour les tests
    localStorage.setItem('luneo-locale', loc);
    document.documentElement.lang = loc;
  }, locale);
}

/**
 * Ferme la bannière de cookies si elle est visible
 * Cette fonction est robuste et attend que la bannière disparaisse
 */
export async function ensureCookieBannerClosed(page: Page): Promise<void> {
  try {
    // Attendre que la page soit chargée
    await page.waitForLoadState('domcontentloaded');
    
    const banner = page.locator('[data-testid="cookie-banner"]');
    
    // Vérifier si la bannière est visible
    const isVisible = await safeIsVisible(banner);
    
    if (isVisible) {
      // Essayer plusieurs sélecteurs pour le bouton d'acceptation
      const acceptSelectors = [
        '[data-testid="cookie-banner-accept-all"]',
        '[data-testid="cookie-accept"]',
        'button:has-text("Accepter")',
        'button:has-text("Accept")',
        'button:has-text("Tout accepter")',
        'button:has-text("Accept all")',
      ];
      
      for (const selector of acceptSelectors) {
        const acceptButton = page.locator(selector).first();
        if (await safeIsVisible(acceptButton)) {
          await acceptButton.click({ force: true });
          // Attendre que la bannière disparaisse
          await banner.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
          break;
        }
      }
      
      // Si la bannière est toujours visible, essayer de la masquer via JavaScript
      if (await safeIsVisible(banner)) {
        await page.evaluate(() => {
          const banner = document.querySelector('[data-testid="cookie-banner"]') as HTMLElement;
          if (banner) {
            banner.style.display = 'none';
          }
          // Aussi accepter les cookies dans localStorage
          localStorage.setItem('cookie-consent', 'accepted');
          localStorage.setItem('luneo-cookies-accepted', 'true');
        });
      }
    }
  } catch {
    // Ignorer les erreurs - la bannière n'est peut-être pas présente
    // Essayer quand même de masquer via JS
    try {
      await page.evaluate(() => {
        const banner = document.querySelector('[data-testid="cookie-banner"]') as HTMLElement;
        if (banner) {
          banner.style.display = 'none';
        }
        localStorage.setItem('cookie-consent', 'accepted');
        localStorage.setItem('luneo-cookies-accepted', 'true');
      });
    } catch {
      // Ignorer
    }
  }
}

/**
 * Attend que la page soit complètement chargée et prête pour les interactions
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle').catch(() => {});
  await ensureCookieBannerClosed(page);
}
