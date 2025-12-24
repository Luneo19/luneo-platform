/**
 * ★★★ SENTRY INITIALIZATION ★★★
 * Initialisation Sentry pour l'application
 */

import { initSentry } from './sentry';

// Initialize Sentry on module load
if (typeof window !== 'undefined') {
  // Client-side initialization
  initSentry();
}

