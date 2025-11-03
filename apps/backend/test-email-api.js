const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';
const TEST_EMAIL = 'service.luneo@gmail.com';

// Fonction pour tester l'API
async function testEmailAPI() {
  console.log('🧪 Test de l\'API Email - Démarrage...\n');

  try {
    // Test 1: Vérifier le statut des providers
    console.log('📊 Test 1: Vérification du statut des providers...');
    const statusResponse = await axios.get(`${API_BASE_URL}/email/status`);
    console.log('✅ Statut des providers:', JSON.stringify(statusResponse.data, null, 2));

    // Test 2: Envoyer un email de bienvenue via Mailgun
    console.log('\n📧 Test 2: Envoi d\'un email de bienvenue via Mailgun...');
    const welcomeResponse = await axios.post(`${API_BASE_URL}/email/test/welcome`, {
      email: TEST_EMAIL,
      name: 'Emmanuel Abou Gadous',
      provider: 'mailgun'
    });
    console.log('✅ Email de bienvenue envoyé:', JSON.stringify(welcomeResponse.data, null, 2));

    // Test 3: Envoyer un email de réinitialisation de mot de passe
    console.log('\n🔐 Test 3: Envoi d\'un email de réinitialisation de mot de passe...');
    const resetResponse = await axios.post(`${API_BASE_URL}/email/test/password-reset`, {
      email: TEST_EMAIL,
      provider: 'mailgun'
    });
    console.log('✅ Email de réinitialisation envoyé:', JSON.stringify(resetResponse.data, null, 2));

    // Test 4: Envoyer un email personnalisé
    console.log('\n✉️ Test 4: Envoi d\'un email personnalisé...');
    const customResponse = await axios.post(`${API_BASE_URL}/email/send`, {
      to: TEST_EMAIL,
      subject: 'Test API Email - Luneo Backend',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">🎉 Test API Email Réussi !</h1>
          <p>Félicitations ! L'API email de votre backend NestJS fonctionne parfaitement.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Détails du test :</h3>
            <ul>
              <li><strong>Provider :</strong> Mailgun</li>
              <li><strong>Timestamp :</strong> ${new Date().toISOString()}</li>
              <li><strong>Status :</strong> ✅ Succès</li>
            </ul>
          </div>
          
          <p>Votre service d'email est maintenant opérationnel !</p>
          <p>Cordialement,<br>L'équipe Luneo</p>
        </div>
      `,
      text: 'Test API Email - Luneo Backend\n\nFélicitations ! L\'API email fonctionne parfaitement.',
      provider: 'mailgun',
      tags: ['api-test', 'integration']
    });
    console.log('✅ Email personnalisé envoyé:', JSON.stringify(customResponse.data, null, 2));

    // Test 5: Test direct Mailgun
    console.log('\n🔧 Test 5: Test direct Mailgun...');
    const mailgunResponse = await axios.post(`${API_BASE_URL}/email/mailgun/simple`, {
      to: TEST_EMAIL,
      subject: 'Test Direct Mailgun - API',
      html: '<h1>Test direct Mailgun via API</h1><p>Ceci est un test direct du service Mailgun.</p>',
      text: 'Test direct Mailgun via API\n\nCeci est un test direct du service Mailgun.'
    });
    console.log('✅ Test direct Mailgun réussi:', JSON.stringify(mailgunResponse.data, null, 2));

    console.log('\n🎉 Tous les tests de l\'API email ont réussi !');
    console.log('📧 Vérifiez votre boîte email pour voir les résultats.');

  } catch (error) {
    console.error('\n💥 Erreur lors des tests:', error.message);
    
    if (error.response) {
      console.error('📊 Détails de l\'erreur:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    process.exit(1);
  }
}

// Fonction pour attendre que l'API soit disponible
async function waitForAPI(maxAttempts = 30) {
  console.log('⏳ Attente du démarrage de l\'API...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ API disponible !');
      return true;
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error('❌ API non disponible après', maxAttempts, 'tentatives');
        return false;
      }
      console.log(`⏳ Tentative ${attempt}/${maxAttempts} - API non disponible, nouvelle tentative dans 2s...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage des tests de l\'API Email...\n');
  
  // Attendre que l'API soit disponible
  const apiAvailable = await waitForAPI();
  if (!apiAvailable) {
    console.error('❌ Impossible de se connecter à l\'API');
    process.exit(1);
  }
  
  // Exécuter les tests
  await testEmailAPI();
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = {
  testEmailAPI,
  waitForAPI,
  main
};
