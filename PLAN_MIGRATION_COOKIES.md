# 🔐 PLAN DE MIGRATION : localStorage → httpOnly Cookies

**Date** : 9 Janvier 2025  
**Priorité** : Haute (Sécurité)  
**Statut** : Planifié

---

## 📋 OBJECTIF

Migrer le stockage des tokens d'authentification de `localStorage` vers des cookies `httpOnly` pour améliorer la sécurité et prévenir les attaques XSS.

---

## 🔍 ÉTAT ACTUEL

### Tokens stockés dans localStorage :
- `accessToken` - Token JWT d'accès (15 min expiration)
- `refreshToken` - Token JWT de rafraîchissement (7 jours)
- `user` - Données utilisateur (JSON stringifié)
- `brandId` - ID de la marque
- `rememberMe` - Préférence utilisateur

### Fichiers concernés :
1. `apps/frontend/src/store/auth.ts` (lignes 56-57, 92-93, 103, 123-124)
2. `apps/frontend/src/app/(auth)/login/page.tsx` (lignes 104, 106, 109, 112)
3. `apps/frontend/src/app/(auth)/register/page.tsx` (lignes 196, 198, 201)
4. `apps/frontend/src/lib/api/client.ts` (lignes 52, 65, 103, 115-116)
5. `apps/frontend/src/lib/trpc/vanilla-client.ts` (lignes 21, 27, 33-38)

---

## ✅ AVANTAGES httpOnly Cookies

1. **Sécurité XSS** : Les cookies httpOnly ne sont pas accessibles via JavaScript
2. **CSRF Protection** : Peut être combiné avec des tokens CSRF
3. **Automatique** : Envoyés automatiquement avec chaque requête
4. **Expiration** : Gestion automatique par le navigateur

---

## 🛠️ PLAN D'IMPLÉMENTATION

### Phase 1 : Backend - Modifier les endpoints auth

**Fichiers à modifier** :
- `apps/backend/src/modules/auth/auth.controller.ts`
- `apps/backend/src/modules/auth/auth.service.ts`

**Changements** :
1. Modifier `login` pour envoyer les tokens en cookies httpOnly
2. Modifier `signup` pour envoyer les tokens en cookies httpOnly
3. Modifier `refresh` pour renouveler le cookie httpOnly
4. Modifier `logout` pour supprimer les cookies

**Exemple** :
```typescript
// Dans auth.controller.ts
@Post('login')
async login(@Body() dto: LoginDto, @Res() res: Response) {
  const { user, accessToken, refreshToken } = await this.authService.login(dto);
  
  // Définir cookies httpOnly
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    path: '/',
  });
  
  // Ne pas retourner les tokens dans le body
  return res.json({ user });
}
```

### Phase 2 : Frontend - Supprimer localStorage

**Fichiers à modifier** :
1. `apps/frontend/src/store/auth.ts`
   - Supprimer `localStorage.setItem('accessToken', ...)`
   - Supprimer `localStorage.setItem('refreshToken', ...)`
   - Supprimer `localStorage.getItem('accessToken')`
   - Supprimer `localStorage.removeItem('accessToken')`

2. `apps/frontend/src/app/(auth)/login/page.tsx`
   - Supprimer toutes les références à `localStorage.setItem`

3. `apps/frontend/src/app/(auth)/register/page.tsx`
   - Supprimer toutes les références à `localStorage.setItem`

4. `apps/frontend/src/lib/api/client.ts`
   - Supprimer la logique de fallback localStorage
   - Les cookies seront envoyés automatiquement avec `withCredentials: true`

5. `apps/frontend/src/lib/trpc/vanilla-client.ts`
   - Supprimer la logique de récupération depuis localStorage

### Phase 3 : Middleware Backend - Lire depuis cookies

**Fichiers à modifier** :
- `apps/backend/src/modules/auth/guards/jwt-auth.guard.ts`
- `apps/backend/src/modules/auth/strategies/jwt.strategy.ts`

**Changements** :
1. Modifier pour lire le token depuis les cookies au lieu du header Authorization
2. Garder le fallback sur Authorization header pour compatibilité

**Exemple** :
```typescript
// Dans jwt.strategy.ts
async validate(payload: any, request: Request) {
  // Essayer cookie d'abord
  const token = request.cookies?.accessToken || 
                request.headers?.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new UnauthorizedException();
  }
  
  // ... reste de la validation
}
```

### Phase 4 : Tests

1. **Tests unitaires** : Vérifier que les cookies sont définis correctement
2. **Tests E2E** : Vérifier le flux complet login → dashboard → logout
3. **Tests sécurité** : Vérifier que les tokens ne sont pas accessibles via JavaScript
4. **Tests compatibilité** : Vérifier que les anciens tokens localStorage fonctionnent encore (transition)

---

## ⚠️ CONSIDÉRATIONS

### Compatibilité ascendante
- Pendant la transition, supporter les deux méthodes (cookies ET localStorage)
- Détecter automatiquement quelle méthode utiliser

### CSRF Protection
- Ajouter des tokens CSRF pour protéger contre les attaques CSRF
- Utiliser `sameSite: 'strict'` pour les cookies

### CORS
- S'assurer que `credentials: true` est configuré côté backend
- Vérifier que `withCredentials: true` est utilisé côté frontend

### Expiration
- Les cookies expirent automatiquement
- Gérer le refresh token automatiquement

---

## 📝 CHECKLIST

### Backend
- [ ] Modifier `auth.controller.ts` pour envoyer cookies
- [ ] Modifier `auth.service.ts` si nécessaire
- [ ] Modifier `jwt.strategy.ts` pour lire depuis cookies
- [ ] Modifier `jwt-auth.guard.ts` si nécessaire
- [ ] Ajouter CSRF protection
- [ ] Configurer CORS avec `credentials: true`
- [ ] Tests unitaires backend

### Frontend
- [ ] Supprimer `localStorage.setItem('accessToken')` de `auth.ts`
- [ ] Supprimer `localStorage.setItem('refreshToken')` de `auth.ts`
- [ ] Supprimer `localStorage.getItem('accessToken')` de `client.ts`
- [ ] Supprimer `localStorage.removeItem('accessToken')` de `auth.ts`
- [ ] Supprimer localStorage de `login/page.tsx`
- [ ] Supprimer localStorage de `register/page.tsx`
- [ ] Supprimer localStorage de `vanilla-client.ts`
- [ ] Vérifier que `withCredentials: true` est partout
- [ ] Tests E2E frontend

### Tests
- [ ] Test login avec cookies
- [ ] Test refresh token avec cookies
- [ ] Test logout supprime cookies
- [ ] Test XSS (tokens non accessibles via JS)
- [ ] Test CSRF protection
- [ ] Test compatibilité ascendante

---

## 🚀 DÉPLOIEMENT

1. **Backend d'abord** : Déployer les changements backend avec support des deux méthodes
2. **Frontend ensuite** : Déployer les changements frontend
3. **Monitoring** : Surveiller les erreurs d'authentification
4. **Nettoyage** : Après validation, supprimer le code de compatibilité localStorage

---

*Document créé le 9 Janvier 2025*
