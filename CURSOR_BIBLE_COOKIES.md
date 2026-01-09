# 🍪 CURSOR BIBLE - HTTPONLY COOKIES

**Guide pour l'implémentation des cookies httpOnly pour les tokens JWT**

---

## ✅ IMPLÉMENTATION COMPLÈTE

### Backend

**Helper** : `apps/backend/src/modules/auth/auth-cookies.helper.ts`

**Fonctionnalités** :
- ✅ `setAuthCookies()` - Définit les cookies httpOnly pour accessToken et refreshToken
- ✅ `clearAuthCookies()` - Supprime les cookies
- ✅ Configuration automatique selon environnement (secure en production)
- ✅ Gestion du domaine (extraction automatique depuis frontendUrl)

**Endpoints mis à jour** :
- ✅ `POST /api/v1/auth/login` - Set cookies + retourne tokens (backward compat)
- ✅ `POST /api/v1/auth/signup` - Set cookies + retourne tokens (backward compat)
- ✅ `POST /api/v1/auth/refresh` - Lit depuis cookies, set nouveaux cookies
- ✅ `POST /api/v1/auth/logout` - Clear cookies

**JWT Strategy** : Mise à jour pour lire depuis cookies OU Authorization header

### Frontend

**API Client** : `apps/frontend/src/lib/api/client.ts`
- ✅ `withCredentials: true` activé (requis pour cookies)
- ✅ Interceptor mis à jour pour fallback localStorage si cookies non disponibles

---

## 🔧 Configuration

### Cookies

**Access Token** :
- Nom : `accessToken`
- HttpOnly : ✅ Oui
- Secure : ✅ En production uniquement
- SameSite : `lax`
- MaxAge : 15 minutes
- Path : `/`

**Refresh Token** :
- Nom : `refreshToken`
- HttpOnly : ✅ Oui
- Secure : ✅ En production uniquement
- SameSite : `lax`
- MaxAge : 7 jours
- Path : `/`

### Domaine

Automatiquement extrait depuis `app.frontendUrl` :
- `http://localhost:3000` → Pas de domaine (localhost)
- `https://app.luneo.app` → Domaine `.luneo.app`

---

## 📝 Migration

### Étape 1 : Backend (✅ FAIT)
- Cookies httpOnly configurés
- Tokens aussi retournés dans response (backward compatibility)

### Étape 2 : Frontend (✅ FAIT)
- `withCredentials: true` activé
- Fallback localStorage si cookies non disponibles

### Étape 3 : Nettoyage (À FAIRE)
Une fois que tout fonctionne avec cookies :

1. **Supprimer tokens de la response** :
   ```typescript
   // Dans auth.controller.ts
   return {
     user: result.user,
     // ❌ Supprimer ces lignes :
     // accessToken: result.accessToken,
     // refreshToken: result.refreshToken,
   };
   ```

2. **Supprimer localStorage** :
   ```typescript
   // Dans les pages login/register
   // ❌ Supprimer :
   // localStorage.setItem('accessToken', ...);
   // localStorage.setItem('refreshToken', ...);
   ```

3. **Nettoyer API client** :
   ```typescript
   // ❌ Supprimer fallback localStorage dans interceptor
   ```

---

## 🧪 Tests

### Tester avec Cookies

```bash
# Login avec curl (cookies stockés automatiquement)
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt -b cookies.txt

# Utiliser cookies pour requête authentifiée
curl http://localhost:3001/api/v1/auth/me \
  -b cookies.txt
```

### Vérifier Cookies

**Frontend (DevTools)** :
1. Ouvrir DevTools → Application/Storage → Cookies
2. Vérifier présence de `accessToken` et `refreshToken`
3. Vérifier que `HttpOnly` est coché

---

## 🔒 Sécurité

### Avantages httpOnly Cookies

✅ **Protection XSS** : Tokens non accessibles via JavaScript
✅ **Protection CSRF** : SameSite=lax aide contre CSRF
✅ **Secure Flag** : HTTPS uniquement en production
✅ **Expiration** : Cookies expirent automatiquement

### Notes

⚠️ **CSRF** : Même avec SameSite=lax, CSRF protection activée dans middleware
⚠️ **CORS** : `credentials: true` requis côté frontend ET backend
⚠️ **Domain** : Configuration automatique mais à vérifier selon environnement

---

## 🐛 Debugging

### Cookies non envoyés

1. Vérifier `withCredentials: true` dans axios
2. Vérifier CORS `credentials: true` côté backend
3. Vérifier domaine des cookies (dev vs production)

### Token non lu

1. Vérifier que cookie-parser est configuré dans main.ts
2. Vérifier JWT Strategy (extractors)
3. Vérifier nom des cookies (accessToken, refreshToken)

### Logout ne fonctionne pas

1. Vérifier `clearAuthCookies()` appelé
2. Vérifier domaine correspondant
3. Vérifier cookies supprimés dans DevTools

---

## 📚 Références

- **NestJS Cookies** : https://docs.nestjs.com/techniques/cookies
- **Axios withCredentials** : https://axios-http.com/docs/config_defaults
- **HttpOnly Cookies** : https://owasp.org/www-community/HttpOnly

---

*Dernière mise à jour : Décembre 2024*
