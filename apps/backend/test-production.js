#!/usr/bin/env node

/**
 * Test de configuration production
 */

require('dotenv').config({ path: '.env.production' });
const nodemailer = require('nodemailer');

async function testProduction() {
  console.log('🧪 Test Configuration Production');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  });
  
  try {
    await transporter.verify();
    console.log('✅ Connexion SMTP Production réussie');
    
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'test@example.com',
      subject: 'Test Production SendGrid',
      text: 'Test de configuration production',
    });
    
    console.log('✅ Email de test envoyé:', result.messageId);
    console.log('🎉 Configuration production validée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testProduction();
