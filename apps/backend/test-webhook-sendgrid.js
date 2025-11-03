#!/usr/bin/env node

/**
 * Test du webhook SendGrid
 * Simule les événements SendGrid pour tester l'endpoint
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

// Événements de test SendGrid
const testEvents = [
  {
    email: "utilisateur@example.com",
    timestamp: Math.floor(Date.now() / 1000),
    event: "delivered",
    "smtp-id": "<14c5d75ce93.dfd.64b7ae@luneo.app>",
    response: "250 OK",
    url: "https://example.com/click",
    useragent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    ip: "192.168.1.1"
  },
  {
    email: "bounce@example.com",
    timestamp: Math.floor(Date.now() / 1000),
    event: "bounce",
    reason: "550 Invalid recipient",
    "smtp-id": "<14c5d75ce93.dfd.64b7ae@luneo.app>",
    type: "bounce",
    category: ["test"]
  },
  {
    email: "spam@example.com",
    timestamp: Math.floor(Date.now() / 1000),
    event: "spam_report",
    "smtp-id": "<14c5d75ce93.dfd.64b7ae@luneo.app>",
    category: ["test"]
  },
  {
    email: "unsubscribe@example.com",
    timestamp: Math.floor(Date.now() / 1000),
    event: "unsubscribe",
    "smtp-id": "<14c5d75ce93.dfd.64b7ae@luneo.app>",
    category: ["newsletter"]
  }
];

async function testWebhookEndpoint(baseUrl = 'http://localhost:3000') {
  const webhookUrl = `${baseUrl}/webhooks/sendgrid`;
  
  logInfo(`🧪 Test du webhook SendGrid: ${webhookUrl}`);
  
  try {
    // Test 1: Événement unique
    logInfo('\n📧 Test 1: Événement unique (delivered)');
    const singleEventResponse = await axios.post(webhookUrl, [testEvents[0]], {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SendGrid-Webhook-Test'
      }
    });
    
    if (singleEventResponse.status === 200) {
      logSuccess('✅ Événement unique traité avec succès');
      logInfo(`Réponse: ${JSON.stringify(singleEventResponse.data, null, 2)}`);
    } else {
      logError(`❌ Erreur HTTP: ${singleEventResponse.status}`);
    }
    
    // Test 2: Plusieurs événements
    logInfo('\n📧 Test 2: Plusieurs événements');
    const multipleEventsResponse = await axios.post(webhookUrl, testEvents, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SendGrid-Webhook-Test'
      }
    });
    
    if (multipleEventsResponse.status === 200) {
      logSuccess('✅ Plusieurs événements traités avec succès');
      logInfo(`Réponse: ${JSON.stringify(multipleEventsResponse.data, null, 2)}`);
    } else {
      logError(`❌ Erreur HTTP: ${multipleEventsResponse.status}`);
    }
    
    // Test 3: Payload vide
    logInfo('\n📧 Test 3: Payload vide');
    const emptyResponse = await axios.post(webhookUrl, [], {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SendGrid-Webhook-Test'
      }
    });
    
    if (emptyResponse.status === 200) {
      logSuccess('✅ Payload vide traité avec succès');
    } else {
      logError(`❌ Erreur HTTP: ${emptyResponse.status}`);
    }
    
    logSuccess('\n🎉 Tous les tests du webhook sont passés !');
    logInfo('Votre endpoint webhook SendGrid est opérationnel.');
    
    return true;
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError('❌ Impossible de se connecter au serveur');
      logWarning('Assurez-vous que l\'application est démarrée avec: npm run start:prod');
      return false;
    } else if (error.response) {
      logError(`❌ Erreur HTTP ${error.response.status}: ${error.response.statusText}`);
      logError(`Détails: ${JSON.stringify(error.response.data, null, 2)}`);
      return false;
    } else {
      logError(`❌ Erreur: ${error.message}`);
      return false;
    }
  }
}

async function testWebhookWithRealPayload() {
  logInfo('\n🔍 Test avec payload réel SendGrid');
  
  // Payload réel basé sur la documentation SendGrid
  const realPayload = [
    {
      "email": "service.luneo@gmail.com",
      "timestamp": 1725601831,
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
  ];
  
  try {
    const response = await axios.post('http://localhost:3000/webhooks/sendgrid', realPayload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SendGrid'
      }
    });
    
    logSuccess('✅ Payload réel traité avec succès');
    logInfo(`Réponse: ${JSON.stringify(response.data, null, 2)}`);
    return true;
    
  } catch (error) {
    logError(`❌ Erreur avec payload réel: ${error.message}`);
    return false;
  }
}

async function main() {
  log('🧪 Test Webhook SendGrid', 'bright');
  log('========================\n', 'bright');
  
  // Test 1: Endpoint webhook
  const webhookTest = await testWebhookEndpoint();
  
  if (webhookTest) {
    // Test 2: Payload réel
    await testWebhookWithRealPayload();
    
    logInfo('\n📋 Instructions pour SendGrid Dashboard:');
    logInfo('1. Allez dans SendGrid Dashboard > Settings > Mail Settings > Event Webhook');
    logInfo('2. URL: https://api.luneo.app/webhooks/sendgrid');
    logInfo('3. Activer les événements: delivered, bounce, dropped, spam_report, unsubscribe');
    logInfo('4. Cliquez sur "Test Integration" pour tester');
    logInfo('5. Vérifiez que vous recevez un HTTP 200 OK');
    
    logSuccess('\n🎉 Votre webhook SendGrid est prêt pour la production !');
  } else {
    logError('\n💥 Tests du webhook échoués');
    logInfo('Vérifiez que l\'application est démarrée et accessible');
  }
}

// Exécuter les tests
if (require.main === module) {
  main();
}

module.exports = {
  testWebhookEndpoint,
  testWebhookWithRealPayload
};
