/**
 * reCAPTCHA v3 Integration
 * Inspired by Stripe's approach to bot protection
 */

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

let scriptLoaded = false;
let scriptLoading = false;

/**
 * Load reCAPTCHA script dynamically
 */
function loadRecaptchaScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    if (window.grecaptcha) {
      resolve();
      return;
    }

    if (scriptLoaded) {
      resolve();
      return;
    }

    if (scriptLoading) {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.grecaptcha) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    scriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
    };
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('Failed to load reCAPTCHA script'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Execute reCAPTCHA v3 and get token
 * @param action Action name (e.g., 'register', 'contact', 'login')
 * @returns reCAPTCHA token
 */
export async function executeRecaptcha(action: string): Promise<string> {
  if (!SITE_KEY) {
    // In development, return empty token if not configured
    if (process.env.NODE_ENV === 'development') {
      return '';
    }
    throw new Error('reCAPTCHA site key not configured');
  }

  await loadRecaptchaScript();

  return new Promise((resolve, reject) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(SITE_KEY, { action })
        .then((token) => {
          resolve(token);
        })
        .catch((error) => {
          reject(error);
        });
    });
  });
}

/**
 * Initialize reCAPTCHA (preload script)
 */
export function initRecaptcha(): void {
  if (typeof window !== 'undefined' && SITE_KEY) {
    loadRecaptchaScript().catch((error) => {
      console.error('Failed to load reCAPTCHA:', error);
    });
  }
}
