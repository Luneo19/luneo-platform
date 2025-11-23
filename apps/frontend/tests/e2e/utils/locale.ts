import { expect, type Page } from '@playwright/test';

const SUPPORTED_LOCALES = ['en', 'fr', 'de'] as const;
export type SupportedTestLocale = (typeof SUPPORTED_LOCALES)[number];

export async function setLocale(page: Page, locale: SupportedTestLocale): Promise<void> {
  await page.goto(`/?lang=${locale}`);
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
}

export async function ensureCookieBannerClosed(page: Page): Promise<void> {
  const banner = page.locator('[data-testid="cookie-banner"]');
  if (await banner.isVisible()) {
    await page.click('[data-testid="cookie-banner-accept-all"]');
    await expect(banner).toBeHidden();
  }
}

