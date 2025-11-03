const Sentry = require('@sentry/nestjs');

// Initialiser Sentry avec la nouvelle configuration
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

console.log('🚀 Test Sentry Logs - Démarrage du test...');

// Test des différents niveaux de logs
console.log('📝 Test console.log - Message informatif');
console.warn('⚠️ Test console.warn - Avertissement');
console.error('❌ Test console.error - Erreur critique');

// Test d'une erreur avec contexte
try {
  throw new Error('Test Sentry - Erreur avec logs contextuels');
} catch (error) {
  console.error('❌ Erreur capturée:', error.message);
  Sentry.captureException(error);
}

// Test d'un message personnalisé
Sentry.captureMessage('Test Sentry - Message personnalisé avec logs', 'info');

console.log('✅ Test des logs terminé !');
console.log('📊 Vérifiez votre dashboard Sentry pour voir les logs et erreurs.');

// Attendre un peu pour que tout soit envoyé
setTimeout(() => {
  console.log('🏁 Test complet terminé');
  process.exit(0);
}, 3000);









