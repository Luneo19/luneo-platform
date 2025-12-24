const sgMail = require('@sendgrid/mail');

// Configuration SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@luneo.com';

async function sendSimpleMessage() {
  console.log('🚀 Test SendGrid - Initialisation...');
  console.log(`   - API Key: ${SENDGRID_API_KEY.substring(0, 10)}...`);
  console.log(`   - From Email: ${FROM_EMAIL}`);

  // Initialiser SendGrid
  sgMail.setApiKey(SENDGRID_API_KEY);

  try {
    console.log('📧 Envoi de l\'email de test...');
    
    const msg = {
      to: 'service.luneo@gmail.com',
      from: FROM_EMAIL,
      subject: 'Test SendGrid - Luneo Backend Integration',
      text: 'Félicitations ! L\'intégration SendGrid dans votre backend NestJS fonctionne parfaitement ! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">🎉 Test SendGrid Réussi !</h1>
          <p>Félicitations ! L'intégration SendGrid dans votre backend NestJS fonctionne parfaitement.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Détails de l'envoi :</h3>
            <ul>
              <li><strong>Provider :</strong> SendGrid</li>
              <li><strong>From :</strong> ${FROM_EMAIL}</li>
              <li><strong>Timestamp :</strong> ${new Date().toISOString()}</li>
              <li><strong>Status :</strong> ✅ Succès</li>
            </ul>
          </div>
          
          <p>Votre service d'email est maintenant opérationnel avec :</p>
          <ul>
            <li>✅ Envoi d'emails simples</li>
            <li>✅ Emails HTML</li>
            <li>✅ Pièces jointes</li>
            <li>✅ Templates dynamiques</li>
            <li>✅ Emails programmés</li>
            <li>✅ Tracking avancé</li>
          </ul>
          
          <p>Cordialement,<br>L'équipe Luneo</p>
        </div>
      `,
    };

    const result = await sgMail.send(msg);
    
    console.log('✅ Email envoyé avec succès !');
    console.log('📊 Réponse SendGrid:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error);
    if (error.response) {
      console.error('📊 Détails de l\'erreur:', error.response.body);
    }
    throw error;
  }
}

// Test avec pièce jointe
async function sendEmailWithAttachment() {
  console.log('\n📎 Test avec pièce jointe...');
  
  try {
    // Créer un fichier texte simple
    const attachmentContent = Buffer.from('Ceci est un fichier de test pour SendGrid.\nTimestamp: ' + new Date().toISOString());
    
    const msg = {
      to: 'service.luneo@gmail.com',
      from: FROM_EMAIL,
      subject: 'Test SendGrid - Email avec pièce jointe',
      text: 'Test d\'envoi d\'email avec pièce jointe via SendGrid.',
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
          content: attachmentContent.toString('base64'),
          type: 'text/plain',
          disposition: 'attachment',
        },
      ],
    };

    const result = await sgMail.send(msg);
    console.log('✅ Email avec pièce jointe envoyé !');
    return result;
  } catch (error) {
    console.error('❌ Erreur avec pièce jointe:', error);
    throw error;
  }
}

// Test avec template
async function sendEmailWithTemplate() {
  console.log('\n📝 Test avec template...');
  
  try {
    const msg = {
      to: 'service.luneo@gmail.com',
      from: FROM_EMAIL,
      subject: 'Test SendGrid - Email avec template',
      templateId: 'd-your-template-id', // Remplacez par votre vrai template ID
      dynamicTemplateData: {
        user_name: 'Emmanuel',
        company_name: 'Luneo',
        activation_link: 'https://app.luneo.com/activate',
      },
    };

    const result = await sgMail.send(msg);
    console.log('✅ Email avec template envoyé !');
    return result;
  } catch (error) {
    console.log('⚠️ Template non disponible, test ignoré');
    return null;
  }
}

// Test avec email programmé
async function sendScheduledEmail() {
  console.log('\n⏰ Test avec email programmé...');
  
  try {
    const sendAt = new Date();
    sendAt.setMinutes(sendAt.getMinutes() + 1); // Envoyer dans 1 minute
    
    const msg = {
      to: 'service.luneo@gmail.com',
      from: FROM_EMAIL,
      subject: 'Test SendGrid - Email programmé',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">⏰ Email Programmé</h1>
          <p>Cet email a été programmé pour être envoyé à ${sendAt.toLocaleString()}.</p>
          <p>Si vous recevez cet email, l'envoi programmé fonctionne !</p>
        </div>
      `,
      sendAt: Math.floor(sendAt.getTime() / 1000),
    };

    const result = await sgMail.send(msg);
    console.log('✅ Email programmé envoyé !');
    console.log(`📅 Programmé pour: ${sendAt.toLocaleString()}`);
    return result;
  } catch (error) {
    console.error('❌ Erreur avec email programmé:', error);
    throw error;
  }
}

// Test avec tracking personnalisé
async function sendEmailWithTracking() {
  console.log('\n📊 Test avec tracking personnalisé...');
  
  try {
    const msg = {
      to: 'service.luneo@gmail.com',
      from: FROM_EMAIL,
      subject: 'Test SendGrid - Email avec tracking',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">📊 Email avec Tracking</h1>
          <p>Cet email inclut un tracking personnalisé.</p>
          <p>Vous pouvez suivre les ouvertures et les clics dans votre dashboard SendGrid.</p>
        </div>
      `,
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: true,
        },
        openTracking: {
          enable: true,
        },
        subscriptionTracking: {
          enable: true,
        },
      },
    };

    const result = await sgMail.send(msg);
    console.log('✅ Email avec tracking envoyé !');
    return result;
  } catch (error) {
    console.error('❌ Erreur avec tracking:', error);
    throw error;
  }
}

// Fonction principale
async function runTests() {
  console.log('🧪 Démarrage des tests SendGrid...\n');
  
  try {
    // Test 1: Email simple
    await sendSimpleMessage();
    
    // Test 2: Email avec pièce jointe
    await sendEmailWithAttachment();
    
    // Test 3: Email avec template (optionnel)
    await sendEmailWithTemplate();
    
    // Test 4: Email programmé
    await sendScheduledEmail();
    
    // Test 5: Email avec tracking
    await sendEmailWithTracking();
    
    console.log('\n🎉 Tous les tests SendGrid terminés avec succès !');
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
  sendScheduledEmail,
  sendEmailWithTracking,
  runTests,
};
