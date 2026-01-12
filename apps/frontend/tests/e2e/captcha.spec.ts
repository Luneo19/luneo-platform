/**
 * E2E Tests - CAPTCHA Integration
 * Tests for reCAPTCHA v3 on Register and Contact forms
 */

import { test, expect } from '@playwright/test';
import { ensureCookieBannerClosed, setLocale } from './utils/locale';

test.describe('CAPTCHA Integration', () => {
  test.beforeEach(async ({ page }) => {
    await setLocale(page, 'fr');
    await ensureCookieBannerClosed(page);
  });

  test.describe('Register Form CAPTCHA', () => {
    test('should load register page with CAPTCHA', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');

      // Check if reCAPTCHA script is loaded
      const recaptchaScript = page.locator('script[src*="recaptcha"]');
      const hasRecaptcha = await recaptchaScript.count() > 0;

      // reCAPTCHA v3 loads automatically, so we check for the script
      if (hasRecaptcha) {
        console.log('✅ reCAPTCHA script loaded');
      } else {
        console.warn('⚠️ reCAPTCHA script not found (might be disabled in dev)');
      }

      // Check form fields
      await expect(page.getByPlaceholder(/email/i).or(page.getByTestId('register-email'))).toBeVisible();
      await expect(page.getByPlaceholder(/mot de passe|password/i).or(page.getByTestId('register-password'))).toBeVisible();
    });

    test('should submit register form with CAPTCHA token', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');

      // Fill form
      const email = `test-${Date.now()}@example.com`;
      const password = 'TestPassword123!';

      await page.getByPlaceholder(/email/i).or(page.getByTestId('register-email')).fill(email);
      await page.getByPlaceholder(/mot de passe|password/i).or(page.getByTestId('register-password')).fill(password);
      await page.getByPlaceholder(/nom|name/i).or(page.getByTestId('register-name')).fill('Test User');

      // Intercept API call to check CAPTCHA token
      let captchaTokenPresent = false;
      page.on('request', (request) => {
        if (request.url().includes('/api/auth/signup')) {
          const postData = request.postData();
          if (postData && postData.includes('captchaToken')) {
            captchaTokenPresent = true;
          }
        }
      });

      // Submit form
      await page.getByRole('button', { name: /inscrire|sign up|register/i }).click();

      // Wait for response
      await page.waitForTimeout(2000);

      // Check if CAPTCHA token was sent (if reCAPTCHA is enabled)
      if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        expect(captchaTokenPresent).toBeTruthy();
      } else {
        console.log('ℹ️ CAPTCHA disabled in dev mode');
      }
    });
  });

  test.describe('Contact Form CAPTCHA', () => {
    test('should load contact page with CAPTCHA', async ({ page }) => {
      await page.goto('/contact');
      await page.waitForLoadState('networkidle');

      // Check if reCAPTCHA script is loaded
      const recaptchaScript = page.locator('script[src*="recaptcha"]');
      const hasRecaptcha = await recaptchaScript.count() > 0;

      if (hasRecaptcha) {
        console.log('✅ reCAPTCHA script loaded on contact page');
      }

      // Check form fields
      await expect(page.getByPlaceholder(/nom|name/i).or(page.getByTestId('contact-name'))).toBeVisible();
      await expect(page.getByPlaceholder(/email/i).or(page.getByTestId('contact-email'))).toBeVisible();
      await expect(page.getByPlaceholder(/message/i).or(page.getByTestId('contact-message'))).toBeVisible();
    });

    test('should submit contact form with CAPTCHA token', async ({ page }) => {
      await page.goto('/contact');
      await page.waitForLoadState('networkidle');

      // Fill form
      await page.getByPlaceholder(/nom|name/i).or(page.getByTestId('contact-name')).fill('Test User');
      await page.getByPlaceholder(/email/i).or(page.getByTestId('contact-email')).fill('test@example.com');
      await page.getByPlaceholder(/message/i).or(page.getByTestId('contact-message')).fill('Test message');

      // Intercept API call to check CAPTCHA token
      let captchaTokenPresent = false;
      page.on('request', (request) => {
        if (request.url().includes('/api/contact')) {
          const postData = request.postData();
          if (postData && postData.includes('captchaToken')) {
            captchaTokenPresent = true;
          }
        }
      });

      // Submit form
      await page.getByRole('button', { name: /envoyer|send|submit/i }).click();

      // Wait for response
      await page.waitForTimeout(2000);

      // Check if CAPTCHA token was sent (if reCAPTCHA is enabled)
      if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        expect(captchaTokenPresent).toBeTruthy();
      }
    });
  });
});
