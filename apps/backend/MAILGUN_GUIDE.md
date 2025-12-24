# 📧 GUIDE D'UTILISATION MAILGUN

## 🎯 **Vue d'ensemble**

Mailgun est maintenant intégré dans votre backend NestJS aux côtés de SendGrid. Le système peut utiliser automatiquement l'un ou l'autre selon la configuration et la disponibilité.

## 🔧 **Configuration**

### Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` :

```bash
# Mailgun Configuration
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_DOMAIN="your-domain.mailgun.org"
MAILGUN_URL="https://api.mailgun.net"  # ou https://api.eu.mailgun.net pour l'UE
FROM_EMAIL="noreply@yourdomain.com"

# SendGrid (optionnel, pour fallback)
SENDGRID_API_KEY="your-sendgrid-api-key"
```

### Configuration avec votre exemple

```bash
MAILGUN_API_KEY="d16e202cab0634bae884cb6da16e6433-1ae02a08-98f24f90"
MAILGUN_DOMAIN="sandbox913d07faa63149f7b48cb7982cccf5fa.mailgun.org"
MAILGUN_URL="https://api.mailgun.net"
FROM_EMAIL="postmaster@sandbox913d07faa63149f7b48cb7982cccf5fa.mailgun.org"
```

## 🚀 **Utilisation**

### 1. **Service Email Unifié**

Le service `EmailService` gère automatiquement le choix du provider :

```typescript
import { EmailService } from './modules/email/email.service';

@Injectable()
export class YourService {
  constructor(private emailService: EmailService) {}

  async sendWelcomeEmail(userEmail: string, userName: string) {
    // Utilise le provider par défaut (auto-détection)
    await this.emailService.sendWelcomeEmail(userEmail, userName);
    
    // Ou spécifiez un provider
    await this.emailService.sendWelcomeEmail(userEmail, userName, 'mailgun');
  }
}
```

### 2. **Service Mailgun Direct**

Pour utiliser Mailgun directement :

```typescript
import { MailgunService } from './modules/email/mailgun.service';

@Injectable()
export class YourService {
  constructor(private mailgunService: MailgunService) {}

  async sendCustomEmail() {
    await this.mailgunService.sendSimpleMessage({
      to: 'user@example.com',
      subject: 'Email personnalisé',
      html: '<h1>Contenu HTML</h1>',
      text: 'Contenu texte',
      tags: ['custom', 'notification'],
    });
  }
}
```

## 📋 **Types d'Emails Disponibles**

### 1. **Email de Bienvenue**
```typescript
await emailService.sendWelcomeEmail(userEmail, userName, 'mailgun');
```

### 2. **Réinitialisation de Mot de Passe**
```typescript
await emailService.sendPasswordResetEmail(userEmail, resetToken, resetUrl, 'mailgun');
```

### 3. **Confirmation d'Email**
```typescript
await emailService.sendConfirmationEmail(userEmail, confirmationToken, confirmationUrl, 'mailgun');
```

### 4. **Email Personnalisé**
```typescript
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Sujet personnalisé',
  html: '<h1>Contenu HTML</h1>',
  text: 'Contenu texte',
  provider: 'mailgun',
  tags: ['custom'],
});
```

## 🧪 **Tests**

### Test via Script Node.js

```bash
# Test direct Mailgun
node test-mailgun.js

# Test avec variables d'environnement
MAILGUN_API_KEY="your-key" MAILGUN_DOMAIN="your-domain" node test-mailgun.js
```

### Test via API REST

Une fois l'application démarrée, utilisez les endpoints :

```bash
# Vérifier le statut des providers
curl http://localhost:3000/api/v1/email/status

# Envoyer un email de test
curl -X POST http://localhost:3000/api/v1/email/test/welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User", "provider": "mailgun"}'

# Envoyer un email personnalisé
curl -X POST http://localhost:3000/api/v1/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Mailgun",
    "html": "<h1>Test</h1>",
    "provider": "mailgun"
  }'
```

## 🔄 **Fallback Automatique**

Le système gère automatiquement le fallback entre providers :

1. **Provider par défaut** : SendGrid (si configuré)
2. **Fallback** : Si SendGrid échoue, utilise Mailgun
3. **Mode auto** : Choisit automatiquement le provider disponible

```typescript
// Mode auto - choisit le meilleur provider disponible
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Test',
  html: '<h1>Test</h1>',
  provider: 'auto', // ou laissez vide pour le provider par défaut
});
```

## 📊 **Fonctionnalités Avancées**

### 1. **Pièces Jointes**
```typescript
await mailgunService.sendSimpleMessage({
  to: 'user@example.com',
  subject: 'Email avec pièce jointe',
  html: '<p>Voir la pièce jointe</p>',
  attachments: [{
    filename: 'document.pdf',
    data: pdfBuffer,
    contentType: 'application/pdf',
  }],
});
```

### 2. **Templates Mailgun**
```typescript
await mailgunService.sendSimpleMessage({
  to: 'user@example.com',
  subject: 'Email avec template',
  template: 'welcome-template',
  templateData: {
    user_name: 'John',
    company_name: 'Luneo',
    activation_link: 'https://app.luneo.com/activate',
  },
});
```

### 3. **Tags et Métadonnées**
```typescript
await mailgunService.sendSimpleMessage({
  to: 'user@example.com',
  subject: 'Email avec tags',
  html: '<p>Contenu</p>',
  tags: ['welcome', 'onboarding', 'user-123'],
  headers: {
    'X-Custom-Header': 'custom-value',
  },
});
```

## 📈 **Statistiques et Monitoring**

### Obtenir les statistiques Mailgun
```typescript
const stats = await mailgunService.getStats();
console.log('Statistiques Mailgun:', stats);
```

### Vérifier le statut des providers
```typescript
const status = emailService.getProviderStatus();
console.log('Status providers:', status);
// { sendgrid: true, mailgun: true, default: 'sendgrid' }
```

## 🔍 **Dépannage**

### Problèmes Courants

1. **"Mailgun not initialized"**
   - Vérifiez `MAILGUN_API_KEY` et `MAILGUN_DOMAIN`
   - Assurez-vous que les variables d'environnement sont chargées

2. **"Domain not found"**
   - Vérifiez que le domaine est correctement configuré dans Mailgun
   - Assurez-vous que le domaine est vérifié

3. **"API key invalid"**
   - Vérifiez que la clé API est correcte
   - Assurez-vous que la clé a les bonnes permissions

### Logs de Debug

Activez les logs détaillés dans votre application :

```typescript
// Dans votre configuration
const mailgunConfig = {
  dsn: process.env.MAILGUN_API_KEY,
  debug: process.env.NODE_ENV === 'development',
};
```

## 🚀 **Déploiement**

### Variables d'environnement de production

```bash
# Production
MAILGUN_API_KEY="key-your-production-key"
MAILGUN_DOMAIN="yourdomain.com"
MAILGUN_URL="https://api.mailgun.net"
FROM_EMAIL="noreply@yourdomain.com"

# Ou pour l'UE
MAILGUN_URL="https://api.eu.mailgun.net"
```

### Vérification post-déploiement

```bash
# Tester l'envoi d'email
curl -X POST https://your-api.com/api/v1/email/test/welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test"}'
```

## 📚 **Ressources**

- [Documentation Mailgun](https://documentation.mailgun.com/)
- [API Mailgun](https://documentation.mailgun.com/en/latest/api_reference.html)
- [Templates Mailgun](https://documentation.mailgun.com/en/latest/user_manual.html#templates)
- [Webhooks Mailgun](https://documentation.mailgun.com/en/latest/user_manual.html#webhooks)

---

*Guide créé pour l'intégration Mailgun dans Luneo Backend*
