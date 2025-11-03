# 📧 GUIDE D'UTILISATION SENDGRID

## 🎯 **Vue d'ensemble**

SendGrid est maintenant intégré dans votre backend NestJS avec toutes les fonctionnalités avancées. Le système peut utiliser SendGrid en tant que provider principal ou en fallback avec Mailgun.

## 🔧 **Configuration**

### Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` :

```bash
# SendGrid Configuration
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@yourdomain.com"

# Mailgun (optionnel, pour fallback)
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_DOMAIN="your-domain.mailgun.org"
MAILGUN_URL="https://api.mailgun.net"
```

### Obtenir une clé API SendGrid

1. **Créer un compte SendGrid** : [https://sendgrid.com](https://sendgrid.com)
2. **Vérifier votre domaine** : Ajoutez votre domaine dans SendGrid
3. **Créer une clé API** : 
   - Allez dans Settings > API Keys
   - Créez une clé avec les permissions "Mail Send"
   - Copiez la clé API

### Configuration recommandée

```bash
SENDGRID_API_KEY="SG.your-sendgrid-api-key-here"
FROM_EMAIL="noreply@yourdomain.com"
```

## 🚀 **Utilisation**

### 1. **Service Email Unifié**

Le service `EmailService` utilise SendGrid par défaut :

```typescript
import { EmailService } from './modules/email/email.service';

@Injectable()
export class YourService {
  constructor(private emailService: EmailService) {}

  async sendWelcomeEmail(userEmail: string, userName: string) {
    // Utilise SendGrid par défaut
    await this.emailService.sendWelcomeEmail(userEmail, userName);
    
    // Ou spécifiez explicitement
    await this.emailService.sendWelcomeEmail(userEmail, userName, 'sendgrid');
  }
}
```

### 2. **Service SendGrid Direct**

Pour utiliser SendGrid directement avec toutes ses fonctionnalités :

```typescript
import { SendGridService } from './modules/email/sendgrid.service';

@Injectable()
export class YourService {
  constructor(private sendgridService: SendGridService) {}

  async sendCustomEmail() {
    await this.sendgridService.sendSimpleMessage({
      to: 'user@example.com',
      subject: 'Email personnalisé',
      html: '<h1>Contenu HTML</h1>',
      text: 'Contenu texte',
      categories: ['custom', 'notification'],
    });
  }
}
```

## 📋 **Types d'Emails Disponibles**

### 1. **Email de Bienvenue**
```typescript
await emailService.sendWelcomeEmail(userEmail, userName, 'sendgrid');
```

### 2. **Réinitialisation de Mot de Passe**
```typescript
await emailService.sendPasswordResetEmail(userEmail, resetToken, resetUrl, 'sendgrid');
```

### 3. **Confirmation d'Email**
```typescript
await emailService.sendConfirmationEmail(userEmail, confirmationToken, confirmationUrl, 'sendgrid');
```

### 4. **Email avec Template SendGrid**
```typescript
await sendgridService.sendTemplateEmail(
  userEmail,
  'd-your-template-id',
  {
    user_name: 'John',
    company_name: 'Luneo',
    activation_link: 'https://app.luneo.com/activate',
  },
  'Bienvenue chez Luneo !'
);
```

### 5. **Email Programmé**
```typescript
const sendAt = new Date();
sendAt.setHours(sendAt.getHours() + 2); // Envoyer dans 2 heures

await sendgridService.sendScheduledEmail(
  userEmail,
  'Rappel important',
  '<h1>N\'oubliez pas votre rendez-vous</h1>',
  sendAt
);
```

### 6. **Email avec Tracking Personnalisé**
```typescript
await sendgridService.sendEmailWithTracking(
  userEmail,
  'Email avec tracking',
  '<h1>Suivez vos performances</h1>',
  {
    clickTracking: true,
    openTracking: true,
    subscriptionTracking: true,
  }
);
```

## 🧪 **Tests**

### Test via Script Node.js

```bash
# Test direct SendGrid
node test-sendgrid.js

# Test avec variables d'environnement
SENDGRID_API_KEY="your-key" FROM_EMAIL="noreply@yourdomain.com" node test-sendgrid.js
```

### Test via API REST

Une fois l'application démarrée, utilisez les endpoints :

```bash
# Vérifier le statut des providers
curl http://localhost:3000/api/v1/email/status

# Envoyer un email de test via SendGrid
curl -X POST http://localhost:3000/api/v1/email/test/welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User", "provider": "sendgrid"}'

# Envoyer un email personnalisé
curl -X POST http://localhost:3000/api/v1/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test SendGrid",
    "html": "<h1>Test</h1>",
    "provider": "sendgrid"
  }'

# Envoyer un email avec template
curl -X POST http://localhost:3000/api/v1/email/sendgrid/template \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "templateId": "d-your-template-id",
    "templateData": {
      "user_name": "John",
      "company_name": "Luneo"
    }
  }'

# Envoyer un email programmé
curl -X POST http://localhost:3000/api/v1/email/sendgrid/scheduled \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "subject": "Email programmé",
    "html": "<h1>Email programmé</h1>",
    "sendAt": "2024-01-15T10:00:00Z"
  }'
```

## 🔄 **Fallback et Redondance**

### Stratégie de Fallback
1. **Provider par défaut** : SendGrid (si configuré)
2. **Fallback automatique** : Mailgun si SendGrid échoue
3. **Mode auto** : Choix automatique du meilleur provider disponible

### Configuration de Redondance
```typescript
// Le système gère automatiquement la redondance
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Important',
  html: '<h1>Contenu important</h1>',
  provider: 'auto', // Utilise le meilleur provider disponible
});
```

## 📊 **Fonctionnalités Avancées SendGrid**

### 1. **Templates Dynamiques**
```typescript
await sendgridService.sendTemplateEmail(
  userEmail,
  'd-your-template-id',
  {
    user_name: 'John',
    company_name: 'Luneo',
    activation_link: 'https://app.luneo.com/activate',
    logo_url: 'https://yourdomain.com/logo.png',
  }
);
```

### 2. **Emails Programmés**
```typescript
const sendAt = new Date();
sendAt.setDate(sendAt.getDate() + 1); // Demain

await sendgridService.sendScheduledEmail(
  userEmail,
  'Rappel de paiement',
  '<h1>Votre facture est prête</h1>',
  sendAt
);
```

### 3. **Tracking Avancé**
```typescript
await sendgridService.sendEmailWithTracking(
  userEmail,
  'Email avec analytics',
  '<h1>Suivez vos performances</h1>',
  {
    clickTracking: true,
    openTracking: true,
    subscriptionTracking: true,
  }
);
```

### 4. **Pièces Jointes**
```typescript
await sendgridService.sendEmailWithAttachments(
  userEmail,
  'Facture en pièce jointe',
  '<p>Veuillez trouver votre facture en pièce jointe.</p>',
  [{
    filename: 'facture.pdf',
    data: pdfBuffer,
    contentType: 'application/pdf',
  }]
);
```

### 5. **Catégories et Métadonnées**
```typescript
await sendgridService.sendSimpleMessage({
  to: userEmail,
  subject: 'Email avec catégories',
  html: '<h1>Contenu</h1>',
  categories: ['welcome', 'onboarding', 'user-123'],
  headers: {
    'X-Custom-Header': 'custom-value',
  },
});
```

## 📈 **Monitoring et Statistiques**

### Statut des Providers
```typescript
const status = emailService.getProviderStatus();
// { sendgrid: true, mailgun: true, default: 'sendgrid' }
```

### Configuration SendGrid
```typescript
const config = sendgridService.getConfig();
// { available: true, defaultFrom: 'noreply@yourdomain.com' }
```

### Statistiques SendGrid
```typescript
const stats = await sendgridService.getStats();
// Statistiques d'envoi (nécessite une clé API avec permissions)
```

## 🔍 **Dépannage**

### Problèmes Courants

1. **"SendGrid not initialized"**
   - Vérifiez `SENDGRID_API_KEY`
   - Assurez-vous que la clé API est valide

2. **"Forbidden" ou "Unauthorized"**
   - Vérifiez les permissions de votre clé API
   - Assurez-vous que votre domaine est vérifié

3. **"From address not verified"**
   - Vérifiez votre domaine dans SendGrid
   - Utilisez une adresse email vérifiée

4. **"Template not found"**
   - Vérifiez l'ID du template
   - Assurez-vous que le template existe dans votre compte

### Logs de Debug

Activez les logs détaillés dans votre application :

```typescript
// Les services incluent des logs détaillés
// Vérifiez la console pour les messages de debug
```

## 🚀 **Déploiement**

### Variables d'environnement de production

```bash
# Production
SENDGRID_API_KEY="SG.your-production-api-key"
FROM_EMAIL="noreply@yourdomain.com"

# Assurez-vous que votre domaine est vérifié dans SendGrid
```

### Vérification post-déploiement

```bash
# Tester l'envoi d'email
curl -X POST https://your-api.com/api/v1/email/test/welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test", "provider": "sendgrid"}'
```

## 📚 **Ressources**

- [Documentation SendGrid](https://docs.sendgrid.com/)
- [API SendGrid](https://docs.sendgrid.com/api-reference/)
- [Templates Dynamiques](https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-transactional-templates/)
- [Webhooks SendGrid](https://docs.sendgrid.com/for-developers/tracking-events/event/)

## 🎯 **Avantages de SendGrid**

### Fonctionnalités Uniques
- ✅ **Templates dynamiques** avancés
- ✅ **Emails programmés** précis
- ✅ **Tracking détaillé** (ouvertures, clics, bounces)
- ✅ **Analytics avancées** et rapports
- ✅ **Gestion des listes** et segments
- ✅ **API robuste** et bien documentée
- ✅ **Support 24/7** et SLA garantis

### Performance
- ✅ **Délivrabilité élevée** (99%+)
- ✅ **Vitesse d'envoi** rapide
- ✅ **Scalabilité** illimitée
- ✅ **Infrastructure** mondiale

---

*Guide créé pour l'intégration SendGrid dans Luneo Backend*
