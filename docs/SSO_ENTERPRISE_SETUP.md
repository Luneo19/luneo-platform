# 🔐 Configuration SSO Enterprise (SAML/OIDC)

Ce document explique comment configurer l'authentification SSO Enterprise pour votre plateforme Luneo.

## 📋 Vue d'ensemble

Luneo Platform supporte deux protocoles SSO Enterprise :
- **SAML 2.0** : Standard pour l'authentification d'entreprise (utilisé par Active Directory, Okta, etc.)
- **OIDC (OpenID Connect)** : Protocole moderne basé sur OAuth 2.0 (utilisé par Azure AD, Google Workspace, etc.)

## 🚀 Configuration SAML

### Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` backend :

```bash
# SAML Configuration
SAML_ENTRY_POINT=https://your-idp.com/sso/saml
SAML_ISSUER=luneo-platform
SAML_CERT=your_saml_certificate_content
SAML_CALLBACK_URL=http://localhost:3001/api/v1/auth/saml/callback
SAML_DECRYPTION_PVK=your_saml_decryption_private_key  # Optionnel
```

### Configuration dans votre IdP (Identity Provider)

1. **Créer une application SAML** dans votre IdP (Okta, Azure AD, etc.)
2. **Configurer les URLs** :
   - **Single Sign-On URL** : `https://your-domain.com/api/v1/auth/saml/callback`
   - **Audience URI (SP Entity ID)** : `luneo-platform`
   - **Name ID Format** : `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`
3. **Mapper les attributs** :
   - `email` → `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`
   - `firstName` → `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname`
   - `lastName` → `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname`
4. **Télécharger le certificat** et le configurer dans `SAML_CERT`

### Endpoints SAML

- **Initiation** : `GET /api/v1/auth/saml`
- **Callback** : `POST /api/v1/auth/saml/callback` (ou `GET`)

### Exemple de configuration Okta

```yaml
Application Name: Luneo Platform
Single Sign-On URL: https://your-domain.com/api/v1/auth/saml/callback
Audience URI: luneo-platform
Name ID Format: EmailAddress
Attribute Statements:
  - email → http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress
  - firstName → http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname
  - lastName → http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname
```

## 🔑 Configuration OIDC

### Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` backend :

```bash
# OIDC Configuration (Azure AD example)
OIDC_ISSUER=https://login.microsoftonline.com/{tenant-id}/v2.0
OIDC_AUTHORIZATION_URL=https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize
OIDC_TOKEN_URL=https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
OIDC_USERINFO_URL=https://login.microsoftonline.com/{tenant-id}/openid/userinfo
OIDC_CLIENT_ID=your_oidc_client_id
OIDC_CLIENT_SECRET=your_oidc_client_secret
OIDC_CALLBACK_URL=http://localhost:3001/api/v1/auth/oidc/callback
OIDC_SCOPE=openid profile email
```

### Configuration Azure AD

1. **Créer une application** dans Azure AD Portal
2. **Configurer les redirect URIs** :
   - `https://your-domain.com/api/v1/auth/oidc/callback`
3. **Configurer les API permissions** :
   - `openid`
   - `profile`
   - `email`
4. **Créer un client secret** et le configurer dans `OIDC_CLIENT_SECRET`

### Configuration Okta (OIDC)

```bash
OIDC_ISSUER=https://your-okta-domain.okta.com/oauth2/default
OIDC_AUTHORIZATION_URL=https://your-okta-domain.okta.com/oauth2/default/v1/authorize
OIDC_TOKEN_URL=https://your-okta-domain.okta.com/oauth2/default/v1/token
OIDC_USERINFO_URL=https://your-okta-domain.okta.com/oauth2/default/v1/userinfo
OIDC_CLIENT_ID=your_okta_client_id
OIDC_CLIENT_SECRET=your_okta_client_secret
OIDC_CALLBACK_URL=https://your-domain.com/api/v1/auth/oidc/callback
OIDC_SCOPE=openid profile email
```

### Endpoints OIDC

- **Initiation** : `GET /api/v1/auth/oidc`
- **Callback** : `GET /api/v1/auth/oidc/callback`

## 🎯 Utilisation

### Frontend - Redirection vers SSO

```typescript
// SAML
window.location.href = 'https://your-domain.com/api/v1/auth/saml';

// OIDC
window.location.href = 'https://your-domain.com/api/v1/auth/oidc';
```

### Après authentification

Après une authentification réussie, l'utilisateur est redirigé vers :
```
https://your-domain.com/auth/callback?next=/overview
```

Les tokens JWT sont automatiquement définis dans des cookies httpOnly sécurisés.

## 🔒 Sécurité

- **HTTPS requis** en production
- **Cookies httpOnly** pour les tokens
- **PKCE** activé pour OIDC (Proof Key for Code Exchange)
- **Validation de signature** SAML
- **Rate limiting** sur tous les endpoints SSO

## 🐛 Dépannage

### Erreur SAML : "SAML profile missing required fields"

Vérifiez que votre IdP envoie bien les attributs requis :
- `email` ou `nameID`
- `firstName` (optionnel)
- `lastName` (optionnel)

### Erreur OIDC : "OIDC authentication failed"

Vérifiez :
1. Les URLs de configuration sont correctes
2. Le `client_id` et `client_secret` sont valides
3. Le callback URL est bien configuré dans votre IdP
4. Les scopes demandés sont autorisés

### Logs de débogage

Activez les logs détaillés dans `auth.service.ts` :

```typescript
this.logger.debug('SAML profile received', { profile });
this.logger.debug('OIDC profile received', { profile });
```

## 📚 Ressources

- [SAML 2.0 Specification](https://docs.oasis-open.org/security/saml/v2.0/)
- [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [Passport SAML Documentation](https://github.com/node-saml/passport-saml)
- [Passport OIDC Documentation](https://github.com/jaredhanson/passport-openidconnect)

## ✅ Checklist de configuration

- [ ] Variables d'environnement configurées
- [ ] Application créée dans l'IdP
- [ ] URLs de callback configurées
- [ ] Certificats/configurations échangés
- [ ] Test d'authentification réussi
- [ ] HTTPS activé en production
- [ ] Logs de débogage activés si nécessaire
