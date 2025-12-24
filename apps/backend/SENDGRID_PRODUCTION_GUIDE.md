# 🚀 Guide de Configuration SendGrid en Production

## 📋 Vue d'ensemble

Ce guide vous accompagne dans la configuration complète de SendGrid pour un déploiement en production professionnel.

## 🎯 Objectifs de Production

- ✅ **Délivrabilité maximale** : Éviter le spam
- ✅ **Authentification complète** : SPF, DKIM, DMARC
- ✅ **Monitoring avancé** : Webhooks et analytics
- ✅ **Sécurité renforcée** : Limites de taux et validation
- ✅ **Templates optimisés** : Emails professionnels
- ✅ **Fallback robuste** : Mailgun en secours

## 🔧 Configuration Production

### 1. Variables d'Environnement Production

```env
# Production Environment
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# SendGrid Production Configuration
SENDGRID_API_KEY=SG.your-production-api-key
SENDGRID_DOMAIN=luneo.app
SENDGRID_FROM_NAME=Luneo
SENDGRID_FROM_EMAIL=no-reply@luneo.app
SENDGRID_REPLY_TO=support@luneo.app

# SMTP Production
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM=Luneo <no-reply@luneo.app>

# Domain Verification
DOMAIN_VERIFIED=true
SPF_RECORD=v=spf1 include:_spf.sendgrid.net ~all
DKIM_RECORD=s1.domainkey.u55797360.wl111.sendgrid.net
DMARC_RECORD=v=DMARC1; p=quarantine; rua=mailto:rapports.dmarc.luneo@gmail.com; ruf=mailto:rapports.dmarc.luneo@gmail.com; fo=1;

# Email Templates Production
EMAIL_TEMPLATE_WELCOME=d-welcome-production-template
EMAIL_TEMPLATE_PASSWORD_RESET=d-password-reset-production-template
EMAIL_TEMPLATE_EMAIL_CONFIRMATION=d-email-confirmation-production-template
EMAIL_TEMPLATE_INVOICE=d-invoice-production-template
EMAIL_TEMPLATE_NEWSLETTER=d-newsletter-production-template

# Fallback Configuration
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.luneo.app
MAILGUN_URL=https://api.mailgun.net

# Security & Monitoring
SENTRY_DSN=your-production-sentry-dsn
SENTRY_ENVIRONMENT=production
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=1000

# Database Production
DATABASE_URL=postgresql://user:password@prod-db:5432/luneo_production

# Redis Production
REDIS_URL=redis://prod-redis:6379

# JWT Production (CHANGEZ CES VALEURS!)
JWT_SECRET=your-super-secure-production-jwt-secret-32-chars
JWT_REFRESH_SECRET=your-super-secure-production-refresh-secret-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe Production
STRIPE_SECRET_KEY=sk_live_your-production-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-production-webhook-secret

# Frontend Production URL
FRONTEND_URL=https://app.luneo.app
```

### 2. Enregistrements DNS Production

#### SPF Record (Recommandé pour Production)
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.sendgrid.net ~all
TTL: 3600
```

#### DMARC Record (Production - Plus Strict)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:rapports.dmarc.luneo@gmail.com; ruf=mailto:rapports.dmarc.luneo@gmail.com; fo=1; adkim=r; aspf=r;
TTL: 3600
```

#### DKIM Records (Vos enregistrements actuels)
```
Type: CNAME
Name: s1._domainkey
Value: s1.domainkey.u55797360.wl111.sendgrid.net

Type: CNAME
Name: s2._domainkey
Value: s2.domainkey.u55797360.wl111.sendgrid.net
```

### 3. Configuration SendGrid Dashboard

#### A. Créer une Clé API Production
1. Connectez-vous à [SendGrid](https://app.sendgrid.com/)
2. Allez dans **Settings > API Keys**
3. Cliquez sur **Create API Key**
4. Nom: `Luneo Production`
5. Permissions: **Full Access** (ou restrictions spécifiques)
6. Copiez la clé API (commence par `SG.`)

#### B. Vérifier l'Authentification du Domaine
1. Allez dans **Settings > Sender Authentication**
2. Vérifiez que `luneo.app` est **Verified**
3. Statut doit être **✅ Authenticated**

#### C. Configurer les Webhooks
1. Allez dans **Settings > Mail Settings > Event Webhook**
2. URL: `https://api.luneo.app/webhooks/sendgrid`
3. Activer les événements:
   - ✅ delivered
   - ✅ bounce
   - ✅ dropped
   - ✅ spam_report
   - ✅ unsubscribe
   - ✅ group_unsubscribe
   - ✅ processed
   - ✅ deferred

### 4. Templates Production

#### Créer des Templates SendGrid
1. Allez dans **Marketing > Dynamic Templates**
2. Créez les templates suivants:

**Template Welcome:**
- ID: `d-welcome-production-template`
- Contenu: Email de bienvenue avec branding Luneo

**Template Password Reset:**
- ID: `d-password-reset-production-template`
- Contenu: Lien de réinitialisation sécurisé

**Template Email Confirmation:**
- ID: `d-email-confirmation-production-template`
- Contenu: Lien de confirmation d'email

### 5. Configuration de Sécurité

#### Limites de Taux Production
```typescript
// Dans votre application
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limite par IP
  message: 'Trop de requêtes, réessayez plus tard'
};
```

#### Validation des Emails
```typescript
// Validation stricte des adresses email
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const isProductionEmail = (email: string) => {
  return emailRegex.test(email) && 
         !email.includes('+') && 
         !email.includes('test');
};
```

### 6. Monitoring et Analytics

#### A. Configuration Sentry Production
```javascript
// sentry.config.js
module.exports = {
  production: {
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,
    beforeSend(event) {
      // Filtrer les erreurs non critiques en production
      if (event.exception) {
        const error = event.exception.values[0];
        if (error.type === 'ValidationError') {
          return null; // Ne pas envoyer les erreurs de validation
        }
      }
      return event;
    }
  }
};
```

#### B. Logging Production
```typescript
// Configuration de logging pour production
const loggerConfig = {
  level: 'info',
  format: 'json',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
};
```

### 7. Tests de Production

#### A. Test de Délivrabilité
```bash
# Tester avec différents providers
node scripts/test-production-deliverability.js
```

#### B. Test de Charge
```bash
# Test de charge pour les emails
node scripts/test-production-load.js
```

#### C. Test de Monitoring
```bash
# Vérifier les webhooks et monitoring
node scripts/test-production-monitoring.js
```

## 🚀 Déploiement

### 1. Build Production
```bash
npm run build
npm run migrate
```

### 2. Variables d'Environnement
```bash
# Copier le fichier de production
cp .env.production .env
```

### 3. Démarrage Production
```bash
npm run start:prod
```

### 4. Vérification Post-Déploiement
```bash
# Test de santé de l'application
curl https://api.luneo.app/health

# Test d'envoi d'email
curl -X POST https://api.luneo.app/api/v1/email/test/welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test Production"}'
```

## 📊 Monitoring Production

### 1. Métriques à Surveiller
- **Taux de délivrabilité** : > 95%
- **Taux de bounce** : < 5%
- **Taux de spam** : < 0.1%
- **Temps de réponse API** : < 200ms
- **Disponibilité** : > 99.9%

### 2. Alertes à Configurer
- Bounce rate > 5%
- Spam rate > 0.1%
- API response time > 500ms
- Service indisponible

### 3. Rapports Réguliers
- Rapport hebdomadaire de délivrabilité
- Analyse mensuelle des performances
- Audit trimestriel de sécurité

## 🔒 Sécurité Production

### 1. Protection API
- Rate limiting strict
- Validation d'entrée renforcée
- Chiffrement des données sensibles
- Audit des logs

### 2. Gestion des Clés
- Rotation régulière des clés API
- Stockage sécurisé des secrets
- Monitoring des accès

### 3. Conformité
- RGPD compliance
- CAN-SPAM Act compliance
- Opt-out obligatoire
- Conservation des données limitée

## 🆘 Dépannage Production

### Problèmes Courants

#### 1. Emails en Spam
```bash
# Vérifier la réputation du domaine
curl -X GET "https://api.sendgrid.com/v3/whitelabel/domains/luneo.app"
```

#### 2. Bounces Élevés
```bash
# Nettoyer la liste de suppression
curl -X DELETE "https://api.sendgrid.com/v3/suppression/bounces/email@example.com"
```

#### 3. Limites de Taux
```bash
# Vérifier les limites
curl -X GET "https://api.sendgrid.com/v3/user/credits"
```

## 📞 Support

### Contacts Importants
- **Support SendGrid** : support@sendgrid.com
- **Documentation** : https://docs.sendgrid.com/
- **Status Page** : https://status.sendgrid.com/

### Escalade
1. Vérifier les logs Sentry
2. Consulter SendGrid Status
3. Contacter le support SendGrid
4. Activer le fallback Mailgun

---

## ✅ Checklist Production

- [ ] Clé API SendGrid production configurée
- [ ] Domaine luneo.app authentifié
- [ ] Enregistrements DNS optimisés
- [ ] Templates SendGrid créés
- [ ] Webhooks configurés
- [ ] Monitoring Sentry activé
- [ ] Rate limiting configuré
- [ ] Tests de production passés
- [ ] Documentation équipe mise à jour
- [ ] Plan de rollback préparé

**🎉 Votre configuration SendGrid est prête pour la production !**
