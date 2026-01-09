# 🔐 CURSOR BIBLE - AUTHENTIFICATION

**Guide complet pour travailler avec l'authentification dans Luneo Platform**

---

## 📍 Localisation des Fichiers

### Backend
```
apps/backend/src/modules/auth/
├── auth.controller.ts      # Routes API
├── auth.service.ts         # Logique métier
├── auth.module.ts          # Module NestJS
├── dto/
│   ├── login.dto.ts
│   ├── signup.dto.ts
│   ├── refresh-token.dto.ts
│   ├── forgot-password.dto.ts  # ⭐ NOUVEAU
│   └── reset-password.dto.ts   # ⭐ NOUVEAU
└── strategies/
    └── jwt.strategy.ts     # Passport JWT
```

### Frontend
```
apps/frontend/src/app/(auth)/
├── login/page.tsx          # ✅ Migré vers API backend
├── register/page.tsx       # ✅ Migré vers API backend
├── forgot-password/page.tsx # ✅ Migré vers API backend
├── reset-password/page.tsx  # ✅ Migré vers API backend
└── verify-email/page.tsx   # ⚠️ À migrer

apps/frontend/src/lib/api/
└── client.ts               # API client avec endpoints.auth.*
```

---

## 🔌 API Endpoints

### POST /api/v1/auth/signup
**Description** : Création d'un nouveau compte

**Body** :
```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole; // Optionnel, défaut: CONSUMER
}
```

**Response** :
```typescript
{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    brandId?: string;
  };
  accessToken: string;
  refreshToken: string;
}
```

**Exemple** :
```typescript
const response = await endpoints.auth.signup({
  email: 'user@example.com',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
});
```

---

### POST /api/v1/auth/login
**Description** : Connexion utilisateur

**Body** :
```typescript
{
  email: string;
  password: string;
}
```

**Response** : Même format que signup

**Exemple** :
```typescript
const response = await endpoints.auth.login({
  email: 'user@example.com',
  password: 'SecurePass123!',
});
```

---

### POST /api/v1/auth/forgot-password ⭐ NOUVEAU
**Description** : Demander la réinitialisation du mot de passe

**Body** :
```typescript
{
  email: string;
}
```

**Response** :
```typescript
{
  message: string; // "If an account with that email exists, a password reset link has been sent."
}
```

**Sécurité** : Ne révèle jamais si l'email existe (protection contre email enumeration)

**Exemple** :
```typescript
await endpoints.auth.forgotPassword('user@example.com');
```

**Flux** :
1. Utilisateur entre son email
2. Backend génère un token JWT (expiration 1h)
3. Email envoyé avec lien : `${appUrl}/reset-password?token=${token}`
4. Utilisateur clique sur le lien

---

### POST /api/v1/auth/reset-password ⭐ NOUVEAU
**Description** : Réinitialiser le mot de passe avec un token

**Body** :
```typescript
{
  token: string;    // Token JWT depuis l'URL
  password: string; // Nouveau mot de passe
}
```

**Response** :
```typescript
{
  message: string; // "Password reset successfully"
}
```

**Sécurité** :
- Token JWT validé (expiration 1h)
- Type de token vérifié (`password-reset`)
- Tous les refresh tokens supprimés (force re-login)

**Exemple** :
```typescript
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

await endpoints.auth.resetPassword(token, 'NewSecurePass123!');
```

---

### POST /api/v1/auth/refresh
**Description** : Rafraîchir le token d'accès

**Body** :
```typescript
{
  refreshToken: string;
}
```

**Response** : Même format que login

**Exemple** :
```typescript
const refreshToken = localStorage.getItem('refreshToken');
const response = await endpoints.auth.refresh(refreshToken);
```

---

### POST /api/v1/auth/logout
**Description** : Déconnexion

**Headers** : `Authorization: Bearer <accessToken>`

**Response** :
```typescript
{
  message: string; // "Logged out successfully"
}
```

**Action** : Supprime tous les refresh tokens de l'utilisateur

---

### GET /api/v1/auth/me
**Description** : Obtenir le profil de l'utilisateur connecté

**Headers** : `Authorization: Bearer <accessToken>`

**Response** : Objet user complet

---

## 🔧 Utilisation dans le Code

### Frontend - Pages

#### Login
```typescript
import { endpoints } from '@/lib/api/client';

const handleLogin = async (email: string, password: string) => {
  try {
    const response = await endpoints.auth.login({ email, password });
    
    // Stocker tokens (TEMPORAIRE - à migrer vers httpOnly cookies)
    localStorage.setItem('accessToken', response.accessToken);
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    
    // Rediriger
    router.push('/overview');
  } catch (error) {
    // Gérer erreur
  }
};
```

#### Forgot Password
```typescript
const handleForgotPassword = async (email: string) => {
  try {
    await endpoints.auth.forgotPassword(email);
    setMessage('Si un compte existe avec cet email, un lien a été envoyé.');
  } catch (error) {
    // Gérer erreur
  }
};
```

#### Reset Password
```typescript
const handleResetPassword = async (password: string) => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (!token) {
    setError('Token manquant');
    return;
  }
  
  try {
    await endpoints.auth.resetPassword(token, password);
    setSuccess('Mot de passe réinitialisé avec succès');
    router.push('/login');
  } catch (error) {
    // Gérer erreur
  }
};
```

---

## 🔒 Sécurité

### Tokens JWT

**Access Token** :
- Expiration : 15 minutes (configurable via `JWT_EXPIRES_IN`)
- Secret : `JWT_SECRET` (minimum 32 caractères)
- Payload : `{ sub: userId, email, role, type: 'access' }`

**Refresh Token** :
- Expiration : 7 jours
- Stockage : Base de données (table `RefreshToken`)
- Secret : `JWT_REFRESH_SECRET` (différent du access token)

**Reset Token** :
- Expiration : 1 heure
- Type : `type: 'password-reset'` dans payload
- Secret : Même que access token (mais vérifie le type)

### Hashing Passwords

- Algorithme : bcrypt
- Rounds : 12 (configuré dans `auth.service.ts`)
- Ne JAMAIS stocker en clair

### Validation

- **Email** : Format email standard
- **Password** : Minimum 8 caractères (frontend), vérifié aussi backend
- **Token** : Validation JWT + vérification type + expiration

---

## 📧 Emails

### Password Reset Email

**Template** : `EmailService.sendPasswordResetEmail()`

**Contenu** :
- Sujet : "Réinitialisation de votre mot de passe"
- Lien : `${appUrl}/reset-password?token=${token}`
- Expiration : 1 heure mentionnée dans l'email

**Provider** : SendGrid, Mailgun, ou SMTP (auto-détection)

---

## 🐛 Debugging

### Vérifier un Token

```typescript
// Backend
const payload = await jwtService.verifyAsync(token, {
  secret: configService.get('jwt.secret'),
});
console.log('Token payload:', payload);
```

### Vérifier un User

```typescript
// Backend
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: {
    refreshTokens: true,
    brand: true,
  },
});
```

### Logs

- Backend : Winston logger (voir logs dans console)
- Frontend : `logger` dans `@/lib/logger`

---

## ✅ Checklist Migration

Pour migrer une page auth :

- [ ] Remplacer Supabase par `endpoints.auth.*`
- [ ] Supprimer imports Supabase
- [ ] Gérer les tokens (temporairement localStorage)
- [ ] Gérer les erreurs avec messages clairs
- [ ] Tester le flux complet
- [ ] Vérifier redirections

---

## 🚀 Prochaines Étapes

1. **httpOnly Cookies** : Migrer tokens localStorage → httpOnly cookies
2. **OAuth** : Migrer OAuth Google/GitHub vers API backend
3. **Email Verification** : Implémenter vérification email
4. **2FA** : Ajouter authentification à deux facteurs

---

*Dernière mise à jour : Décembre 2024*
