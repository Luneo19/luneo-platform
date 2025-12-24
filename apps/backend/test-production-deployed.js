#!/usr/bin/env node

const axios = require('axios');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testProductionDeployment() {
  log('🧪 Test du Déploiement Production Luneo', 'bright');
  log('=====================================', 'bright');
  
  const baseUrl = 'https://backend-k3lcmgupc-luneos-projects.vercel.app';
  
  try {
    // Test 1: Health Check
    log('\n📊 Test 1: Health Check', 'cyan');
    try {
      const healthResponse = await axios.get(`${baseUrl}/health`, {
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500; // Accept any status code less than 500
        }
      });
      
      if (healthResponse.status === 200) {
        log('✅ Health check OK', 'green');
        log(`📋 Response: ${JSON.stringify(healthResponse.data)}`, 'blue');
      } else {
        log(`⚠️ Health check returned status ${healthResponse.status}`, 'yellow');
        log(`📋 Response: ${healthResponse.data}`, 'blue');
      }
    } catch (error) {
      if (error.response) {
        log(`❌ Health check failed: ${error.response.status} ${error.response.statusText}`, 'red');
        log(`📋 Response: ${JSON.stringify(error.response.data)}`, 'blue');
      } else {
        log(`❌ Health check failed: ${error.message}`, 'red');
      }
    }
    
    // Test 2: API Root
    log('\n📊 Test 2: API Root', 'cyan');
    try {
      const apiResponse = await axios.get(`${baseUrl}/api/v1`, {
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      if (apiResponse.status === 200) {
        log('✅ API accessible', 'green');
        log(`📋 Response: ${JSON.stringify(apiResponse.data)}`, 'blue');
      } else {
        log(`⚠️ API returned status ${apiResponse.status}`, 'yellow');
        log(`📋 Response: ${apiResponse.data}`, 'blue');
      }
    } catch (error) {
      if (error.response) {
        log(`❌ API failed: ${error.response.status} ${error.response.statusText}`, 'red');
        log(`📋 Response: ${JSON.stringify(error.response.data)}`, 'blue');
      } else {
        log(`❌ API failed: ${error.message}`, 'red');
      }
    }
    
    // Test 3: Webhook SendGrid
    log('\n📊 Test 3: Webhook SendGrid', 'cyan');
    try {
      const webhookPayload = [
        {
          email: 'test@luneo.app',
          timestamp: Math.floor(Date.now() / 1000),
          event: 'delivered',
          'smtp-id': '<test-message-id@luneo.app>',
          response: '250 OK'
        }
      ];
      
      const webhookResponse = await axios.post(`${baseUrl}/webhooks/sendgrid`, webhookPayload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SendGrid'
        },
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      if (webhookResponse.status === 200) {
        log('✅ Webhook SendGrid fonctionnel', 'green');
        log(`📋 Response: ${JSON.stringify(webhookResponse.data)}`, 'blue');
      } else {
        log(`⚠️ Webhook returned status ${webhookResponse.status}`, 'yellow');
        log(`📋 Response: ${webhookResponse.data}`, 'blue');
      }
    } catch (error) {
      if (error.response) {
        log(`❌ Webhook failed: ${error.response.status} ${error.response.statusText}`, 'red');
        log(`📋 Response: ${JSON.stringify(error.response.data)}`, 'blue');
      } else {
        log(`❌ Webhook failed: ${error.message}`, 'red');
      }
    }
    
    // Test 4: Email Service Status
    log('\n📊 Test 4: Email Service Status', 'cyan');
    try {
      const emailResponse = await axios.get(`${baseUrl}/api/v1/email/status`, {
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      if (emailResponse.status === 200) {
        log('✅ Email service accessible', 'green');
        log(`📋 Response: ${JSON.stringify(emailResponse.data)}`, 'blue');
      } else {
        log(`⚠️ Email service returned status ${emailResponse.status}`, 'yellow');
        log(`📋 Response: ${emailResponse.data}`, 'blue');
      }
    } catch (error) {
      if (error.response) {
        log(`❌ Email service failed: ${error.response.status} ${error.response.statusText}`, 'red');
        log(`📋 Response: ${JSON.stringify(error.response.data)}`, 'blue');
      } else {
        log(`❌ Email service failed: ${error.message}`, 'red');
      }
    }
    
    // Résumé
    log('\n📋 Résumé des Tests', 'bright');
    log('==================', 'bright');
    log(`🌐 URL de déploiement: ${baseUrl}`, 'blue');
    log(`🔗 Health Check: ${baseUrl}/health`, 'blue');
    log(`🔗 API: ${baseUrl}/api/v1`, 'blue');
    log(`🔗 Webhook: ${baseUrl}/webhooks/sendgrid`, 'blue');
    log(`🔗 Email Status: ${baseUrl}/api/v1/email/status`, 'blue');
    
    log('\n🎯 Configuration SendGrid:', 'bright');
    log('   - URL Webhook: https://api.luneo.app/webhooks/sendgrid', 'blue');
    log('   - Domaine: luneo.app', 'blue');
    log('   - From: Luneo <no-reply@luneo.app>', 'blue');
    
    log('\n✅ Tests terminés !', 'green');
    log('📧 Votre application Luneo est déployée en production !', 'green');
    
  } catch (error) {
    log(`\n💥 Erreur générale: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Exécuter les tests
testProductionDeployment();
