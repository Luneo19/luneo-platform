/**
 * Mixpanel Integration
 * Inspired by Linear and Stripe analytics
 */

declare global {
  interface Window {
    mixpanel: {
      init: (token: string, config?: Record<string, unknown>) => void;
      track: (eventName: string, properties?: Record<string, unknown>) => void;
      identify: (userId: string) => void;
      people: {
        set: (properties: Record<string, unknown>) => void;
      };
      register: (properties: Record<string, unknown>) => void;
      reset: () => void;
    };
  }
}

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '';

let initialized = false;

/**
 * Initialize Mixpanel
 */
export function initMixpanel(): void {
  if (typeof window === 'undefined' || !MIXPANEL_TOKEN || initialized) {
    return;
  }

  // Load Mixpanel script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://cdn.mixpanel.com/lib/mixpanel-2-latest.min.js';
  script.onload = () => {
    if (window.mixpanel) {
      window.mixpanel.init(MIXPANEL_TOKEN, {
        api_host: 'https://api.mixpanel.com',
        loaded: () => {
          initialized = true;
        },
      });
    }
  };
  document.head.appendChild(script);
}

/**
 * Track event
 */
export function trackMixpanelEvent(
  eventName: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined' || !window.mixpanel || !initialized) {
    return;
  }

  window.mixpanel.track(eventName, {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Identify user
 */
export function identifyMixpanelUser(userId: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.mixpanel || !initialized) {
    return;
  }

  window.mixpanel.identify(userId);
  
  if (properties) {
    window.mixpanel.people.set(properties);
  }
}

/**
 * Set user properties
 */
export function setMixpanelUserProperties(properties: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.mixpanel || !initialized) {
    return;
  }

  window.mixpanel.people.set(properties);
}

/**
 * Register super properties (sent with every event)
 */
export function registerMixpanelSuperProperties(properties: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.mixpanel || !initialized) {
    return;
  }

  window.mixpanel.register(properties);
}

/**
 * Reset user (on logout)
 */
export function resetMixpanel(): void {
  if (typeof window === 'undefined' || !window.mixpanel || !initialized) {
    return;
  }

  window.mixpanel.reset();
}
