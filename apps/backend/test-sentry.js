const Sentry = require('@sentry/nestjs');

// Initialiser Sentry
Sentry.init({
  dsn: "https://9b98e0a9e22c4d2f88b22edf3d1c7ddf@o4509948310519808.ingest.de.sentry.io/4509948332998736",
  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
  // Enable logs to be sent to Sentry
  enableLogs: true,
  environment: 'test',
  debug: true,
});

console.log('🚀 Test Sentry - Envoi d\'une erreur de test...');

// Envoyer une erreur de test
Sentry.captureException(new Error('Test Sentry - Erreur de test depuis le script'));

console.log('✅ Erreur envoyée à Sentry !');
console.log('📊 Vérifiez votre dashboard Sentry pour voir l\'erreur.');

// Attendre un peu pour que l'erreur soit envoyée
setTimeout(() => {
  console.log('🏁 Test terminé');
  process.exit(0);
}, 2000);
