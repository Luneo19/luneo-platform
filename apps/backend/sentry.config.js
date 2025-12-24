const Sentry = require('@sentry/nestjs');

// Configuration Sentry pour différents environnements
const sentryConfig = {
  development: {
    dsn: process.env.SENTRY_DSN || "https://9b98e0a9e22c4d2f88b22edf3d1c7ddf@o4509948310519808.ingest.de.sentry.io/4509948332998736",
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
    ],
    enableLogs: true,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    debug: true,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    sendDefaultPii: true,
    release: process.env.npm_package_version || '1.0.0-dev',
  },
  production: {
    dsn: process.env.SENTRY_DSN || "https://9b98e0a9e22c4d2f88b22edf3d1c7ddf@o4509948310519808.ingest.de.sentry.io/4509948332998736",
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }), // Pas de logs en prod
    ],
    enableLogs: true,
    environment: process.env.SENTRY_ENVIRONMENT || 'production',
    debug: false,
    tracesSampleRate: 0.1, // 10% des requêtes
    profilesSampleRate: 0.1, // 10% des profils
    sendDefaultPii: false, // Pas de PII en production
    release: process.env.npm_package_version || '1.0.0',
    beforeSend(event) {
      // Filtrer les erreurs sensibles
      if (event.exception) {
        const exception = event.exception.values[0];
        if (exception.value && exception.value.includes('password')) {
          return null; // Ne pas envoyer les erreurs contenant "password"
        }
      }
      return event;
    },
  },
  test: {
    dsn: process.env.SENTRY_DSN || "https://9b98e0a9e22c4d2f88b22edf3d1c7ddf@o4509948310519808.ingest.de.sentry.io/4509948332998736",
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ["error"] }), // Seulement les erreurs en test
    ],
    enableLogs: true,
    environment: process.env.SENTRY_ENVIRONMENT || 'test',
    debug: false,
    tracesSampleRate: 0.0, // Pas de tracing en test
    profilesSampleRate: 0.0, // Pas de profiling en test
    sendDefaultPii: false,
    release: process.env.npm_package_version || '1.0.0-test',
  }
};

// Fonction d'initialisation
function initSentry(environment = 'development') {
  const config = sentryConfig[environment] || sentryConfig.development;
  
  console.log(`🚀 Initialisation Sentry pour l'environnement: ${environment}`);
  
  Sentry.init(config);
  
  return Sentry;
}

module.exports = { initSentry, sentryConfig };
