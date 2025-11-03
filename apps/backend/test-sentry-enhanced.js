const Sentry = require('@sentry/nestjs');

// Configuration de test améliorée
const testConfig = {
  dsn: process.env.SENTRY_DSN || "https://9b98e0a9e22c4d2f88b22edf3d1c7ddf@o4509948310519808.ingest.de.sentry.io/4509948332998736",
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
  enableLogs: true,
  environment: process.env.SENTRY_ENVIRONMENT || 'test',
  debug: true,
  release: process.env.npm_package_version || '1.0.0-test',
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  sendDefaultPii: false,
};

console.log('🔧 Configuration Sentry:');
console.log(`   - DSN: ${testConfig.dsn.substring(0, 50)}...`);
console.log(`   - Environment: ${testConfig.environment}`);
console.log(`   - Release: ${testConfig.release}`);
console.log(`   - Debug: ${testConfig.debug}`);

// Initialiser Sentry
Sentry.init(testConfig);

console.log('\n🚀 Test Sentry Enhanced - Démarrage des tests...');

// Test 1: Message simple
console.log('\n📝 Test 1: Message simple');
Sentry.captureMessage('Test Sentry Enhanced - Message simple', 'info');

// Test 2: Erreur avec contexte
console.log('\n📝 Test 2: Erreur avec contexte');
Sentry.setContext('user', {
  id: 'test-user-123',
  email: 'test@example.com',
  brandId: 'test-brand-456'
});

Sentry.setTag('test_type', 'enhanced_test');
Sentry.setTag('test_phase', 'context_test');

try {
  throw new Error('Test Sentry Enhanced - Erreur avec contexte utilisateur');
} catch (error) {
  Sentry.captureException(error);
}

// Test 3: Performance monitoring (corrigé)
console.log('\n📝 Test 3: Performance monitoring');
try {
  // Utiliser l'API correcte pour les transactions
  const transaction = Sentry.getCurrentHub().startTransaction({
    name: 'test-transaction',
    op: 'test.operation'
  });

  // Simuler un travail
  setTimeout(() => {
    const span = transaction.startChild({
      op: 'test.sub_operation',
      description: 'Test sub-operation'
    });
    
    setTimeout(() => {
      span.finish();
      transaction.setStatus('ok');
      transaction.finish();
      console.log('✅ Transaction terminée');
    }, 100);
  }, 100);
} catch (error) {
  console.log('⚠️ Performance monitoring non disponible:', error.message);
}

// Test 4: Breadcrumbs
console.log('\n📝 Test 4: Breadcrumbs');
Sentry.addBreadcrumb({
  category: 'test',
  message: 'Test breadcrumb ajouté',
  level: 'info',
  data: {
    timestamp: new Date().toISOString(),
    testId: 'breadcrumb-test-001'
  }
});

Sentry.captureMessage('Test Sentry Enhanced - Message avec breadcrumbs', 'info');

// Test 5: Erreur avec stack trace personnalisée
console.log('\n📝 Test 5: Erreur avec stack trace personnalisée');
const customError = new Error('Test Sentry Enhanced - Erreur personnalisée');
customError.stack = `Error: Test Sentry Enhanced - Erreur personnalisée
    at test-sentry-enhanced.js:unknown (unknown)
    at Object.<anonymous> (test-sentry-enhanced.js:unknown)
    at Module._compile (internal/modules/cjs/loader.js:unknown)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:unknown)`;

Sentry.captureException(customError);

console.log('\n✅ Tous les tests envoyés !');
console.log('📊 Vérifiez votre dashboard Sentry pour voir les résultats.');

// Attendre que tout soit envoyé
setTimeout(() => {
  console.log('\n🏁 Test complet terminé');
  console.log('💡 Conseils:');
  console.log('   - Vérifiez les "Issues" dans Sentry');
  console.log('   - Regardez les "Performance" pour les transactions');
  console.log('   - Consultez les "Logs" pour les breadcrumbs');
  process.exit(0);
}, 5000);
