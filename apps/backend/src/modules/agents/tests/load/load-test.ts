/**
 * Tests de charge pour Agents IA
 * Usage: npm run test:load
 */

import * as autocannon from 'autocannon';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const TOKEN = process.env.TEST_TOKEN || '';

if (!TOKEN) {
  console.error('❌ TEST_TOKEN requis');
  process.exit(1);
}

const testConfig = {
  url: `${BACKEND_URL}/api/agents/luna/chat`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'What are my sales?',
    brandId: 'test-brand-id',
    userId: 'test-user-id',
  }),
  connections: 10, // Nombre de connexions simultanées
  duration: 30, // Durée en secondes
  pipelining: 1,
};

console.log('🚀 Test de charge - Agents IA');
console.log('==============================');
console.log(`URL: ${testConfig.url}`);
console.log(`Connections: ${testConfig.connections}`);
console.log(`Duration: ${testConfig.duration}s`);
console.log('');

autocannon(testConfig, (err, result) => {
  if (err) {
    console.error('❌ Erreur:', err);
    process.exit(1);
  }

  console.log('📊 Résultats:');
  console.log(`Requests: ${result.requests.total}`);
  console.log(`Throughput: ${result.throughput.mean} req/s`);
  console.log(`Latency: ${result.latency.mean}ms`);
  console.log(`Errors: ${result.errors}`);
  console.log(`Timeouts: ${result.timeouts}`);
  console.log('');

  if (result.errors > 0) {
    console.error('⚠️  Des erreurs ont été détectées');
    process.exit(1);
  }

  console.log('✅ Test de charge terminé avec succès');
});
