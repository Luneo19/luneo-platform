import OptimizedImage from '../components/optimized/OptimizedImage';

/**
 * EMAIL TEMPLATES PROFESSIONNELS
 * Templates HTML pour emails transactionnels Luneo
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';
const BRAND_COLOR = '#6366f1'; // Indigo-500
const BRAND_NAME = 'Luneo';

/**
 * Layout de base pour tous les emails
 */
function emailLayout(content: string) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BRAND_NAME}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #8b5cf6 100%);
      padding: 40px 24px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 32px;
      font-weight: bold;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px 24px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: ${BRAND_COLOR};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 24px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 32px 24px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 32px 0;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      margin: 0 0 16px 0;
    }
    p {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }
    .highlight {
      background-color: #fef3c7;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
      margin: 24px 0;
    }
    .stats {
      background-color: #f9fafb;
      padding: 24px;
      border-radius: 8px;
      margin: 24px 0;
    }
    .stats-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .stats-row:last-child {
      border-bottom: none;
    }
    .stats-label {
      color: #6b7280;
      font-size: 14px;
    }
    .stats-value {
      color: #111827;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${BASE_URL}" class="logo">${BRAND_NAME}</a>
    </div>
    ${content}
    <div class="footer">
      <p style="margin-bottom: 16px;">
        <strong>${BRAND_NAME}</strong> - Plateforme SaaS pour designs AR
      </p>
      <p style="margin-bottom: 8px;">
        <a href="${BASE_URL}/legal/terms" style="color: #6b7280; text-decoration: none;">Conditions d'utilisation</a> • 
        <a href="${BASE_URL}/legal/privacy" style="color: #6b7280; text-decoration: none;">Confidentialité</a> • 
        <a href="${BASE_URL}/help" style="color: #6b7280; text-decoration: none;">Support</a>
      </p>
      <p style="font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} ${BRAND_NAME}. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * EMAIL DE BIENVENUE
 */
export function welcomeEmail(params: {
  userName: string;
  loginUrl?: string;
}) {
  const { userName, loginUrl = `${BASE_URL}/login` } = params;

  const content = `
    <div class="content">
      <h1>🎉 Bienvenue sur ${BRAND_NAME}, ${userName} !</h1>
      <p>Nous sommes ravis de vous accueillir dans notre communauté de créateurs.</p>
      <p>
        Avec ${BRAND_NAME}, vous pouvez créer des designs innovants avec l'IA et les visualiser en réalité augmentée.
        Parfait pour les marques de luxe et les créateurs exigeants.
      </p>
      
      <div class="highlight">
        <p style="margin: 0;">
          <strong>🚀 Pour commencer :</strong><br/>
          Connectez-vous et explorez nos fonctionnalités : AI Studio, AR Viewer, Integrations e-commerce.
        </p>
      </div>

      <center>
        <a href="${loginUrl}" class="button">Accéder à mon compte</a>
      </center>

      <div class="divider"></div>

      <p><strong>Ce que vous pouvez faire maintenant :</strong></p>
      <ul style="color: #4b5563; line-height: 1.8;">
        <li>✨ Générer votre premier design avec l'IA (DALL-E 3)</li>
        <li>📱 Visualiser en AR sur mobile</li>
        <li>🛍️ Connecter votre boutique Shopify</li>
        <li>📊 Consulter vos analytics en temps réel</li>
      </ul>

      <p>Si vous avez des questions, notre équipe est là pour vous aider !</p>
    </div>
  `;

  return emailLayout(content);
}

/**
 * EMAIL DE CONFIRMATION DE COMMANDE
 */
export function orderConfirmationEmail(params: {
  userName: string;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  currency: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  orderUrl?: string;
}) {
  const {
    userName,
    orderNumber,
    orderDate,
    totalAmount,
    currency,
    items,
    orderUrl = `${BASE_URL}/orders`,
  } = params;

  const itemsHtml = items
    .map(
      (item) => `
        <div class="stats-row">
          <div>
            <div class="stats-label">${item.name}</div>
            <div style="font-size: 12px; color: #9ca3af;">Quantité: ${item.quantity}</div>
          </div>
          <div class="stats-value">${item.price.toFixed(2)} ${currency}</div>
        </div>
      `
    )
    .join('');

  const content = `
    <div class="content">
      <h1>✅ Commande confirmée !</h1>
      <p>Bonjour ${userName},</p>
      <p>
        Nous avons bien reçu votre commande <strong>#${orderNumber}</strong>.
        Vous recevrez un email de suivi dès l'expédition.
      </p>

      <div class="stats">
        <h3 style="margin: 0 0 16px 0; color: #111827;">Détails de la commande</h3>
        ${itemsHtml}
        <div class="divider"></div>
        <div class="stats-row">
          <div class="stats-label">Total</div>
          <div class="stats-value" style="font-size: 20px; color: ${BRAND_COLOR};">
            ${totalAmount.toFixed(2)} ${currency}
          </div>
        </div>
        <div class="stats-row">
          <div class="stats-label">Date</div>
          <div class="stats-value">${new Date(orderDate).toLocaleDateString('fr-FR')}</div>
        </div>
      </div>

      <center>
        <a href="${orderUrl}" class="button">Voir ma commande</a>
      </center>

      <p style="margin-top: 32px;">
        Merci de votre confiance ! 🙏
      </p>
    </div>
  `;

  return emailLayout(content);
}

/**
 * EMAIL D'INVITATION À UNE ÉQUIPE
 */
export function teamInviteEmail(params: {
  inviterName: string;
  invitedEmail: string;
  teamName: string;
  role: string;
  acceptUrl: string;
}) {
  const { inviterName, invitedEmail, teamName, role, acceptUrl } = params;

  const content = `
    <div class="content">
      <h1>🎯 Invitation à rejoindre une équipe</h1>
      <p>Bonjour,</p>
      <p>
        <strong>${inviterName}</strong> vous invite à rejoindre l'équipe <strong>${teamName}</strong> sur ${BRAND_NAME}.
      </p>

      <div class="highlight">
        <p style="margin: 0;">
          <strong>Rôle attribué :</strong> ${role === 'admin' ? '👑 Administrateur' : role === 'designer' ? '🎨 Designer' : '👤 Membre'}<br/>
          <strong>Email :</strong> ${invitedEmail}
        </p>
      </div>

      <center>
        <a href="${acceptUrl}" class="button">Accepter l'invitation</a>
      </center>

      <p style="margin-top: 32px;">
        En tant que ${role}, vous pourrez :
      </p>
      <ul style="color: #4b5563; line-height: 1.8;">
        ${
          role === 'admin'
            ? `
          <li>👑 Gérer l'équipe et les permissions</li>
          <li>📊 Accéder à toutes les analytics</li>
          <li>💳 Gérer la facturation</li>
        `
            : role === 'designer'
            ? `
          <li>🎨 Créer et modifier des designs</li>
          <li>📱 Visualiser en AR</li>
          <li>📤 Exporter vos créations</li>
        `
            : `
          <li>👀 Consulter les designs</li>
          <li>💬 Commenter et collaborer</li>
          <li>📊 Voir les analytics basiques</li>
        `
        }
      </ul>

      <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
        Ce lien est valable 7 jours. Si vous n'avez pas demandé cette invitation, ignorez cet email.
      </p>
    </div>
  `;

  return emailLayout(content);
}

/**
 * EMAIL DE RÉINITIALISATION DE MOT DE PASSE
 */
export function passwordResetEmail(params: {
  userName: string;
  resetUrl: string;
}) {
  const { userName, resetUrl } = params;

  const content = `
    <div class="content">
      <h1>🔐 Réinitialisation de mot de passe</h1>
      <p>Bonjour ${userName},</p>
      <p>
        Vous avez demandé à réinitialiser votre mot de passe ${BRAND_NAME}.
        Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
      </p>

      <center>
        <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
      </center>

      <div class="highlight" style="margin-top: 32px;">
        <p style="margin: 0;">
          <strong>⚠️ Important :</strong><br/>
          Ce lien est valable 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
      </div>

      <p style="margin-top: 32px; font-size: 14px; color: #6b7280;">
        Pour votre sécurité, ne partagez jamais ce lien avec qui que ce soit.
      </p>
    </div>
  `;

  return emailLayout(content);
}

/**
 * EMAIL DE NOTIFICATION DE DESIGN TERMINÉ
 */
export function designCompletedEmail(params: {
  userName: string;
  designPrompt: string;
  designUrl: string;
  previewUrl: string;
}) {
  const { userName, designPrompt, designUrl, previewUrl } = params;

  const content = `
    <div class="content">
      <h1>✨ Votre design est prêt !</h1>
      <p>Bonjour ${userName},</p>
      <p>
        Votre design <strong>"${designPrompt}"</strong> a été généré avec succès !
      </p>

      ${
        previewUrl
          ? `
      <center>
        <OptimizedImage src="${previewUrl}" alt="Design preview" style={max-width: 100%; border-radius: 8px; margin: 24px 0;} />
      </center>
      `
          : ''
      }

      <center>
        <a href="${designUrl}" class="button">Voir mon design</a>
      </center>

      <p style="margin-top: 32px;">
        Vous pouvez maintenant :
      </p>
      <ul style="color: #4b5563; line-height: 1.8;">
        <li>📱 Le visualiser en AR sur votre mobile</li>
        <li>📥 Le télécharger en haute résolution</li>
        <li>🔗 Le partager avec votre équipe</li>
        <li>🛍️ L'exporter vers Shopify</li>
      </ul>
    </div>
  `;

  return emailLayout(content);
}

