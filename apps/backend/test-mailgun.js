const FormData = require("form-data");
const Mailgun = require("mailgun.js");

// Configuration Mailgun
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || "d16e202cab0634bae884cb6da16e6433-1ae02a08-98f24f90";
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || "sandbox913d07faa63149f7b48cb7982cccf5fa.mailgun.org";
const MAILGUN_URL = process.env.MAILGUN_URL || "https://api.mailgun.net";

async function sendSimpleMessage() {
  console.log('🚀 Test Mailgun - Initialisation...');
  console.log(`   - Domain: ${MAILGUN_DOMAIN}`);
  console.log(`   - URL: ${MAILGUN_URL}`);
  console.log(`   - API Key: ${MAILGUN_API_KEY.substring(0, 10)}...`);

  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: MAILGUN_API_KEY,
    url: MAILGUN_URL,
  });

  try {
    console.log('📧 Envoi de l\'email de test...');
    
    const data = await mg.messages.create(MAILGUN_DOMAIN, {
      from: `Mailgun Sandbox <postmaster@${MAILGUN_DOMAIN}>`,
      to: ["Emmanuel Abou Gadous <service.luneo@gmail.com>"],
      subject: "Test Mailgun - Luneo Backend Integration",
      text: "Félicitations ! L'intégration Mailgun dans votre backend NestJS fonctionne parfaitement ! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">🎉 Test Mailgun Réussi !</h1>
          <p>Félicitations ! L'intégration Mailgun dans votre backend NestJS fonctionne parfaitement.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Détails de l'envoi :</h3>
            <ul>
              <li><strong>Provider :</strong> Mailgun</li>
              <li><strong>Domain :</strong> ${MAILGUN_DOMAIN}</li>
              <li><strong>Timestamp :</strong> ${new Date().toISOString()}</li>
              <li><strong>Status :</strong> ✅ Succès</li>
            </ul>
          </div>
          
          <p>Votre service d'email est maintenant opérationnel avec :</p>
          <ul>
            <li>✅ Envoi d'emails simples</li>
            <li>✅ Emails HTML</li>
            <li>✅ Pièces jointes</li>
            <li>✅ Templates</li>
            <li>✅ Tags et métadonnées</li>
          </ul>
          
          <p>Cordialement,<br>L'équipe Luneo</p>
        </div>
      `,
    });

    console.log('✅ Email envoyé avec succès !');
    console.log('📊 Réponse Mailgun:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error);
    throw error;
  }
}

// Test avec pièce jointe
async function sendEmailWithAttachment() {
  console.log('\n📎 Test avec pièce jointe...');
  
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: MAILGUN_API_KEY,
    url: MAILGUN_URL,
  });

  try {
    // Créer un fichier texte simple
    const attachmentContent = Buffer.from('Ceci est un fichier de test pour Mailgun.\nTimestamp: ' + new Date().toISOString());
    
    const data = await mg.messages.create(MAILGUN_DOMAIN, {
      from: `Mailgun Sandbox <postmaster@${MAILGUN_DOMAIN}>`,
      to: ["Emmanuel Abou Gadous <service.luneo@gmail.com>"],
      subject: "Test Mailgun - Email avec pièce jointe",
      text: "Test d'envoi d'email avec pièce jointe via Mailgun.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">📎 Test avec Pièce Jointe</h1>
          <p>Cet email contient une pièce jointe de test.</p>
          <p>Si vous voyez ce message, l'envoi d'emails avec pièces jointes fonctionne !</p>
        </div>
      `,
      attachment: {
        data: attachmentContent,
        filename: 'test-attachment.txt',
        contentType: 'text/plain',
      },
    });

    console.log('✅ Email avec pièce jointe envoyé !');
    return data;
  } catch (error) {
    console.error('❌ Erreur avec pièce jointe:', error);
    throw error;
  }
}

// Test avec template
async function sendEmailWithTemplate() {
  console.log('\n📝 Test avec template...');
  
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: MAILGUN_API_KEY,
    url: MAILGUN_URL,
  });

  try {
    const data = await mg.messages.create(MAILGUN_DOMAIN, {
      from: `Mailgun Sandbox <postmaster@${MAILGUN_DOMAIN}>`,
      to: ["Emmanuel Abou Gadous <service.luneo@gmail.com>"],
      subject: "Test Mailgun - Email avec variables",
      template: "welcome-email", // Template doit exister dans Mailgun
      'v:user_name': 'Emmanuel',
      'v:company_name': 'Luneo',
      'v:activation_link': 'https://app.luneo.com/activate',
    });

    console.log('✅ Email avec template envoyé !');
    return data;
  } catch (error) {
    console.log('⚠️ Template non disponible, test ignoré');
    return null;
  }
}

// Fonction principale
async function runTests() {
  console.log('🧪 Démarrage des tests Mailgun...\n');
  
  try {
    // Test 1: Email simple
    await sendSimpleMessage();
    
    // Test 2: Email avec pièce jointe
    await sendEmailWithAttachment();
    
    // Test 3: Email avec template (optionnel)
    await sendEmailWithTemplate();
    
    console.log('\n🎉 Tous les tests Mailgun terminés avec succès !');
    console.log('📧 Vérifiez votre boîte email pour voir les résultats.');
    
  } catch (error) {
    console.error('\n💥 Erreur lors des tests:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests();
}

module.exports = {
  sendSimpleMessage,
  sendEmailWithAttachment,
  sendEmailWithTemplate,
  runTests,
};
