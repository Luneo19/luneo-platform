#!/usr/bin/env node

/**
 * Test direct du webhook SendGrid
 * Simule exactement ce que SendGrid va envoyer à votre endpoint
 */

const axios = require('axios');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Configuration de votre webhook SendGrid
const webhookConfig = {
  url: 'https://api.luneo.app/webhooks/sendgrid',
  webhookId: 'b94c76ff-5ee3-4843-ab98-3c37853c6525',
  friendlyName: 'Webhook SendGrid',
  state: 'Enabled',
  signedEvent: 'Enabled'
};

// Payloads de test basés sur la documentation SendGrid
const testPayloads = {
  // Test 1: Événement de test SendGrid (ce que SendGrid envoie lors du "Test Integration")
  testIntegration: [
    {
      "email": "test@example.com",
      "timestamp": Math.floor(Date.now() / 1000),
      "event": "test_event",
      "sg_event_id": "sg_event_id_test",
      "sg_message_id": "sg_message_id_test",
      "test": true
    }
  ],

  // Test 2: Événement delivered (email livré)
  delivered: [
    {
      "email": "service.luneo@gmail.com",
      "timestamp": Math.floor(Date.now() / 1000),
      "event": "delivered",
      "sg_event_id": "sg_event_id_1",
      "sg_message_id": "sg_message_id_1",
      "response": "250 OK",
      "smtp-id": "<14c5d75ce93.dfd.64b7ae@luneo.app>",
      "useragent": "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
      "ip": "192.168.1.1",
      "url": "https://luneo.app/welcome",
      "category": ["welcome", "onboarding"],
      "unique_args": {
        "user_id": "12345",
        "campaign": "welcome_series"
      }
    }
  ],

  // Test 3: Événement bounce (email en bounce)
  bounce: [
    {
      "email": "bounce@example.com",
      "timestamp": Math.floor(Date.now() / 1000),
      "event": "bounce",
      "reason": "550 Invalid recipient",
      "sg_event_id": "sg_event_id_2",
      "sg_message_id": "sg_message_id_2",
      "smtp-id": "<14c5d75ce93.dfd.64b7ae@luneo.app>",
      "type": "bounce",
      "category": ["test"]
    }
  ],

  // Test 4: Événement spam_report
  spamReport: [
    {
      "email": "spam@example.com",
      "timestamp": Math.floor(Date.now() / 1000),
      "event": "spam_report",
      "sg_event_id": "sg_event_id_3",
      "sg_message_id": "sg_message_id_3",
      "smtp-id": "<14c5d75ce93.dfd.64b7ae@luneo.app>",
      "category": ["newsletter"]
    }
  ],

  // Test 5: Événement unsubscribe
  unsubscribe: [
    {
      "email": "unsubscribe@example.com",
      "timestamp": Math.floor(Date.now() / 1000),
      "event": "unsubscribe",
      "sg_event_id": "sg_event_id_4",
      "sg_message_id": "sg_message_id_4",
      "smtp-id": "<14c5d75ce93.dfd.64b7ae@luneo.app>",
      "category": ["newsletter"]
    }
  ]
};

async function testWebhookEndpoint(payload, testName) {
  logInfo(`\n🧪 Test: ${testName}`);
  logInfo(`URL: ${webhookConfig.url}`);
  logInfo(`Payload: ${JSON.stringify(payload, null, 2)}`);

  try {
    const response = await axios.post(webhookConfig.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SendGrid',
        'X-SendGrid-Webhook-ID': webhookConfig.webhookId
      },
      timeout: 10000 // 10 secondes timeout
    });

    logSuccess(`✅ ${testName} - Succès !`);
    logInfo(`Status: ${response.status} ${response.statusText}`);
    logInfo(`Réponse: ${JSON.stringify(response.data, null, 2)}`);
    
    return { success: true, status: response.status, data: response.data };
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError(`❌ ${testName} - Impossible de se connecter au serveur`);
      logWarning('Assurez-vous que votre application est déployée et accessible à https://api.luneo.app');
      return { success: false, error: 'Connection refused' };
    } else if (error.response) {
      logError(`❌ ${testName} - Erreur HTTP ${error.response.status}: ${error.response.statusText}`);
      logError(`Détails: ${JSON.stringify(error.response.data, null, 2)}`);
      return { success: false, error: `HTTP ${error.response.status}` };
    } else if (error.code === 'ENOTFOUND') {
      logError(`❌ ${testName} - Domaine non trouvé: ${error.hostname}`);
      logWarning('Vérifiez que votre domaine api.luneo.app est configuré et accessible');
      return { success: false, error: 'Domain not found' };
    } else {
      logError(`❌ ${testName} - Erreur: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

async function testLocalWebhook(payload, testName) {
  const localUrl = 'http://localhost:3000/webhooks/sendgrid';
  
  logInfo(`\n🧪 Test Local: ${testName}`);
  logInfo(`URL: ${localUrl}`);

  try {
    const response = await axios.post(localUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SendGrid'
      },
      timeout: 5000
    });

    logSuccess(`✅ ${testName} - Succès Local !`);
    logInfo(`Status: ${response.status}`);
    logInfo(`Réponse: ${JSON.stringify(response.data, null, 2)}`);
    
    return { success: true, status: response.status, data: response.data };
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logWarning(`⚠️  ${testName} - Application locale non démarrée`);
      logInfo('Pour tester localement: npm run dev');
      return { success: false, error: 'Local app not running' };
    } else {
      logError(`❌ ${testName} - Erreur locale: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

async function main() {
  log('🧪 Test Direct Webhook SendGrid', 'bright');
  log('================================\n', 'bright');
  
  logInfo('Configuration de votre webhook:');
  logInfo(`  - URL: ${webhookConfig.url}`);
  logInfo(`  - ID: ${webhookConfig.webhookId}`);
  logInfo(`  - Nom: ${webhookConfig.friendlyName}`);
  logInfo(`  - État: ${webhookConfig.state}`);
  logInfo(`  - Événements signés: ${webhookConfig.signedEvent}`);
  
  const results = {
    production: {},
    local: {}
  };

  // Tests en production
  logInfo('\n🌐 Tests en Production (https://api.luneo.app)');
  logInfo('===============================================');
  
  for (const [testName, payload] of Object.entries(testPayloads)) {
    results.production[testName] = await testWebhookEndpoint(payload, testName);
    
    // Pause entre les tests pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Tests locaux
  logInfo('\n🏠 Tests Locaux (http://localhost:3000)');
  logInfo('========================================');
  
  for (const [testName, payload] of Object.entries(testPayloads)) {
    results.local[testName] = await testLocalWebhook(payload, testName);
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Résumé des résultats
  logInfo('\n📊 Résumé des Tests');
  logInfo('===================');
  
  const productionSuccess = Object.values(results.production).filter(r => r.success).length;
  const localSuccess = Object.values(results.local).filter(r => r.success).length;
  
  logInfo(`Production: ${productionSuccess}/${Object.keys(results.production).length} tests réussis`);
  logInfo(`Local: ${localSuccess}/${Object.keys(results.local).length} tests réussis`);
  
  if (productionSuccess > 0) {
    logSuccess('\n🎉 Votre webhook SendGrid fonctionne en production !');
    logInfo('SendGrid peut maintenant envoyer des événements à votre endpoint.');
  } else {
    logWarning('\n⚠️  Votre webhook n\'est pas accessible en production');
    logInfo('Vérifiez que votre application est déployée à https://api.luneo.app');
  }
  
  if (localSuccess > 0) {
    logSuccess('🏠 Votre webhook fonctionne aussi localement !');
  }

  // Instructions pour SendGrid Dashboard
  logInfo('\n📋 Instructions SendGrid Dashboard:');
  logInfo('1. Allez dans Settings > Mail Settings > Event Webhook');
  logInfo('2. Cliquez sur "Test Integration" pour votre webhook');
  logInfo('3. Vérifiez que vous recevez un HTTP 200 OK');
  logInfo('4. Consultez les logs de votre application pour voir les événements');
  
  logInfo('\n🔗 Votre webhook est configuré et prêt !');
  logInfo(`URL: ${webhookConfig.url}`);
  logInfo(`ID: ${webhookConfig.webhookId}`);
}

// Exécuter les tests
if (require.main === module) {
  main();
}

module.exports = {
  testWebhookEndpoint,
  testLocalWebhook,
  webhookConfig,
  testPayloads
};
