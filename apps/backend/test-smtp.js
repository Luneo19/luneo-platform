const nodemailer = require('nodemailer');

// Configuration SMTP SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key';
const SMTP_FROM = process.env.SMTP_FROM || 'Luneo <no-reply@luneo.app>';

async function testSMTP() {
  console.log('🧪 Test de connexion SMTP SendGrid...');
  console.log(`   - API Key: ${SENDGRID_API_KEY.substring(0, 10)}...`);
  console.log(`   - From: ${SMTP_FROM}`);

  // Créer le transporteur SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey', // Always 'apikey' for SendGrid
      pass: SENDGRID_API_KEY,
    },
    // Options pour une meilleure délivrabilité
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 14, // SendGrid permet 14 emails par seconde
    rateDelta: 1000, // Par seconde
  });

  try {
    console.log('🔍 Vérification de la connexion SMTP...');
    
    // Vérifier la connexion
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie !');
    
    console.log('📧 Envoi de l\'email de test...');
    
    // Envoyer un email de test
    const result = await transporter.sendMail({
      from: SMTP_FROM,
      to: 'service.luneo@gmail.com',
      subject: 'Test SMTP SendGrid - Luneo Backend',
      text: 'Félicitations ! Votre configuration SMTP SendGrid fonctionne parfaitement ! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">🎉 Test SMTP Réussi !</h1>
          <p>Félicitations ! Votre configuration SMTP SendGrid fonctionne parfaitement.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Détails de l'envoi :</h3>
            <ul>
              <li><strong>Provider :</strong> SendGrid SMTP</li>
              <li><strong>From :</strong> ${SMTP_FROM}</li>
              <li><strong>SMTP :</strong> smtp.sendgrid.net:587</li>
              <li><strong>Timestamp :</strong> ${new Date().toISOString()}</li>
              <li><strong>Status :</strong> ✅ Succès</li>
            </ul>
          </div>
          
          <p>Votre service d'email est maintenant opérationnel avec :</p>
          <ul>
            <li>✅ Connexion SMTP sécurisée</li>
            <li>✅ Authentification de domaine</li>
            <li>✅ Envoi d'emails professionnels</li>
            <li>✅ Rate limiting configuré</li>
            <li>✅ Pool de connexions</li>
          </ul>
          
          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #2e7d32; margin: 0;">Configuration Recommandée</h4>
            <p style="margin: 10px 0 0 0; color: #2e7d32;">
              Votre format SMTP_FROM est correct : <code>${SMTP_FROM}</code>
            </p>
          </div>
          
          <p>Cordialement,<br>L'équipe Luneo</p>
        </div>
      `,
    });
    
    console.log('✅ Email envoyé avec succès !');
    console.log('📧 Message ID:', result.messageId);
    console.log('📊 Réponse complète:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ Erreur lors du test SMTP:', error.message);
    
    if (error.response) {
      console.error('📊 Détails de l\'erreur:', error.response.body);
    }
    
    // Suggestions de dépannage
    console.log('\n🔍 Suggestions de dépannage :');
    console.log('1. Vérifiez que SENDGRID_API_KEY est correcte');
    console.log('2. Assurez-vous que votre domaine est authentifié dans SendGrid');
    console.log('3. Vérifiez que SMTP_FROM utilise votre domaine vérifié');
    console.log('4. Consultez les logs SendGrid pour plus de détails');
    
    throw error;
  }
}

// Test avec pièce jointe
async function testSMTPWithAttachment() {
  console.log('\n📎 Test avec pièce jointe...');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: SENDGRID_API_KEY,
    },
  });

  try {
    // Créer un fichier texte simple
    const attachmentContent = Buffer.from('Ceci est un fichier de test pour SendGrid SMTP.\nTimestamp: ' + new Date().toISOString());
    
    const result = await transporter.sendMail({
      from: SMTP_FROM,
      to: 'service.luneo@gmail.com',
      subject: 'Test SMTP - Email avec pièce jointe',
      text: 'Test d\'envoi d\'email avec pièce jointe via SendGrid SMTP.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">📎 Test avec Pièce Jointe</h1>
          <p>Cet email contient une pièce jointe de test.</p>
          <p>Si vous voyez ce message, l'envoi d'emails avec pièces jointes fonctionne !</p>
        </div>
      `,
      attachments: [
        {
          filename: 'test-attachment.txt',
          content: attachmentContent,
          contentType: 'text/plain',
        },
      ],
    });
    
    console.log('✅ Email avec pièce jointe envoyé !');
    console.log('📧 Message ID:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Erreur avec pièce jointe:', error.message);
    throw error;
  }
}

// Test de vérification de connexion
async function testSMTPConnection() {
  console.log('\n🔍 Test de vérification de connexion...');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: SENDGRID_API_KEY,
    },
  });

  try {
    await transporter.verify();
    console.log('✅ Vérification de connexion réussie !');
    return true;
  } catch (error) {
    console.error('❌ Échec de la vérification de connexion:', error.message);
    return false;
  }
}

// Fonction principale
async function runTests() {
  console.log('🧪 Démarrage des tests SMTP SendGrid...\n');
  
  try {
    // Test 1: Vérification de connexion
    await testSMTPConnection();
    
    // Test 2: Email simple
    await testSMTP();
    
    // Test 3: Email avec pièce jointe
    await testSMTPWithAttachment();
    
    console.log('\n🎉 Tous les tests SMTP terminés avec succès !');
    console.log('📧 Vérifiez votre boîte email pour voir les résultats.');
    console.log('\n✅ Votre configuration SMTP SendGrid est opérationnelle !');
    
  } catch (error) {
    console.error('\n💥 Erreur lors des tests SMTP:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests();
}

module.exports = {
  testSMTP,
  testSMTPWithAttachment,
  testSMTPConnection,
  runTests,
};
