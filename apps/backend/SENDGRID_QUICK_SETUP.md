# 🚀 Configuration Rapide SendGrid

## 🎯 **État Actuel**

Le script de vérification a détecté que votre configuration SendGrid nécessite des ajustements. Voici ce qui manque :

- ❌ **Clé API SendGrid** - Non configurée
- ❌ **Domaine** - Non configuré
- ❌ **Authentification de domaine** - Non terminée

## ⚡ **Actions Immédiates**

### 1. **Configurer SendGrid (5 minutes)**

#### A. Créer un compte SendGrid
1. Allez sur [https://sendgrid.com](https://sendgrid.com)
2. Cliquez sur "Start for Free"
3. Créez votre compte (100 emails/jour gratuits)
4. Vérifiez votre email

#### B. Générer une clé API
1. Connectez-vous à SendGrid
2. Allez dans **Settings > API Keys**
3. Cliquez sur **"Create API Key"**
4. Nommez-la : `Luneo Backend`
5. Sélectionnez **"Mail Send"** permissions
6. Copiez la clé API (commence par `SG.`)

### 2. **Configurer votre Domaine (10 minutes)**

#### A. Authentifier votre domaine
1. Dans SendGrid, allez dans **Settings > Sender Authentication**
2. Cliquez sur **"Authenticate Your Domain"**
3. Entrez votre domaine (ex: `luneo.app`)
4. Suivez les instructions DNS

#### B. Ajouter les enregistrements DNS
Ajoutez ces enregistrements dans votre fournisseur DNS :

**SPF Record :**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.sendgrid.net ~all
```

**DKIM Record (fourni par SendGrid) :**
```
Type: TXT
Name: s1._domainkey.votre-domaine.com
Value: [Fourni par SendGrid]
```

**DMARC Record :**
```
Type: TXT
Name: _dmarc.votre-domaine.com
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@votre-domaine.com
```

### 3. **Configurer votre Application (2 minutes)**

#### A. Exécuter le script de configuration
```bash
node scripts/verify-sendgrid-setup.js
```

Ce script vous guidera pour :
- Entrer votre clé API
- Configurer votre domaine
- Générer le fichier `.env`

#### B. Ou configurer manuellement
Ajoutez ces variables à votre `.env` :

```bash
# SendGrid Configuration
SENDGRID_API_KEY="SG.votre-clé-api-ici"

# Domain Configuration
SENDGRID_DOMAIN="votre-domaine.com"
SENDGRID_FROM_NAME="Luneo"
SENDGRID_FROM_EMAIL="no-reply@votre-domaine.com"
SENDGRID_REPLY_TO="support@votre-domaine.com"

# SMTP Configuration
SMTP_FROM="Luneo <no-reply@votre-domaine.com>"
DOMAIN_VERIFIED="true"
```

### 4. **Tester la Configuration (1 minute)**

```bash
# Vérifier la configuration
node scripts/check-sendgrid-status.js

# Tester l'envoi d'email
node test-smtp.js
```

## 🔧 **Fournisseurs DNS Courants**

### Cloudflare
1. `DNS > Records`
2. `Add record`
3. Type: `TXT`
4. Ajoutez chaque enregistrement

### Google Domains
1. `DNS > Records personnalisés`
2. `Créer un enregistrement`
3. Type: `TXT`
4. Ajoutez chaque enregistrement

### OVH
1. `Zone DNS`
2. `Ajouter une entrée`
3. Type: `TXT`
4. Ajoutez chaque enregistrement

### AWS Route 53
1. `Hosted zones > votre-domaine.com`
2. `Create record`
3. Type: `TXT`
4. Ajoutez chaque enregistrement

## ⏱️ **Délais de Propagation**

- **DNS** : 5-30 minutes (parfois jusqu'à 24h)
- **SendGrid** : Vérification automatique toutes les heures
- **Test** : Immédiat après configuration

## 🧪 **Tests de Validation**

### Test 1 : Connexion SMTP
```bash
node scripts/check-sendgrid-status.js
```

### Test 2 : Envoi d'email
```bash
node test-smtp.js
```

### Test 3 : API REST
```bash
# Démarrer l'application
npm run start:dev

# Tester l'endpoint
curl -X POST http://localhost:3000/api/v1/email/test/welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User", "provider": "sendgrid"}'
```

## 🚨 **Problèmes Courants**

### "From address not verified"
**Solution :** Attendez que SendGrid vérifie votre domaine (1-24h)

### "Authentication failed"
**Solution :** Vérifiez que votre clé API est correcte

### "Rate limit exceeded"
**Solution :** Respectez la limite de 100 emails/jour (gratuit)

### "DNS not propagated"
**Solution :** Attendez la propagation DNS (5-30 minutes)

## 📞 **Support**

### SendGrid Support
- [Documentation](https://docs.sendgrid.com/)
- [Support](https://support.sendgrid.com/)
- [Community](https://community.sendgrid.com/)

### Outils de Vérification DNS
- [MXToolbox](https://mxtoolbox.com/)
- [DNS Checker](https://dnschecker.org/)
- [Google Dig](https://toolbox.googleapps.com/apps/dig/)

## ✅ **Checklist Rapide**

- [ ] Compte SendGrid créé
- [ ] Clé API générée
- [ ] Domaine authentifié dans SendGrid
- [ ] Enregistrements DNS ajoutés
- [ ] Fichier `.env` configuré
- [ ] Test de connexion réussi
- [ ] Test d'envoi d'email réussi

## 🎉 **Félicitations !**

Une fois ces étapes terminées, votre configuration SendGrid sera opérationnelle et vous pourrez :

- ✅ Envoyer des emails professionnels
- ✅ Utiliser votre domaine personnalisé
- ✅ Bénéficier d'une délivrabilité optimale
- ✅ Éviter le spam
- ✅ Suivre les performances

---

*Guide de configuration rapide SendGrid pour Luneo*
