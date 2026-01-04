# 🔍 Analyse Erreur HTTP 500 - Frontend Vercel

**Date** : 5 janvier 2026, 00:00

## ✅ Constatations

### 1. Build Vercel ✅
- ✅ Build réussi : "Build Completed in /vercel/output [3m]"
- ✅ Déploiement réussi : "Deployment completed"
- ✅ Status : Ready

### 2. Backend Railway ✅
- ✅ Endpoint `/api/health` : **200 OK**
- ✅ Backend fonctionnel

### 3. Frontend Vercel ⚠️
- ⚠️ HTTP Status : **500 Internal Server Error**
- ⚠️ HTML retourné : Page d'erreur Next.js (`id="__next_error__"`)
- ✅ Configuration variables : Correcte (`NEXT_PUBLIC_API_URL` = `https://api.luneo.app/api`)

## 🔍 Analyse du Code

### Fonctions Appelées dans `layout.tsx`

1. **`loadI18nConfig()`** (`src/i18n/server.ts`)
   - ✅ Ne fait pas d'appels externes
   - ✅ Utilise seulement cookies/headers
   - ✅ Devrait fonctionner normalement

2. **`loadFeatureFlags()`** (`src/lib/feature-flags/loadFeatureFlags.ts`)
   - ⚠️ Fait un fetch vers `/api/feature-flags` (route locale Next.js)
   - ⚠️ Construit l'URL avec `NEXT_PUBLIC_APP_URL` ou `VERCEL_URL`
   - ⚠️ A un timeout de 5 secondes et un fallback
   - ⚠️ **Si cette route échoue, cela pourrait causer une erreur 500**

### Code de `loadFeatureFlags()`

```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                'http://localhost:3000';
const endpoint = `${baseUrl}/api/feature-flags`;

try {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
    next: {
      revalidate: 60,
    },
  });
  
  // ...
} catch {
  return { flags: DEFAULT_FLAGS, updatedAt: new Date().toISOString() };
}
```

**Problème potentiel** :
- Le fetch est fait côté serveur (Server Component)
- Si `NEXT_PUBLIC_APP_URL` = `https://app.luneo.app`, le fetch essaie de se connecter à `https://app.luneo.app/api/feature-flags`
- **Mais dans un Server Component Next.js, on ne peut pas faire de fetch vers l'URL externe de l'application**
- Il faut utiliser une URL relative ou interne

## 🔧 Solution Proposée

### Correction de `loadFeatureFlags()`

Le problème est que `loadFeatureFlags()` essaie de faire un fetch vers une URL externe (`https://app.luneo.app/api/feature-flags`) depuis un Server Component.

**Solution** : Utiliser une URL relative `/api/feature-flags` au lieu d'une URL absolue.

**Code corrigé** :
```typescript
export async function loadFeatureFlags(): Promise<{
  flags: Record<string, boolean>;
  updatedAt: string | null;
}> {
  // Utiliser une URL relative pour les Server Components
  const endpoint = '/api/feature-flags';
  
  try {
    // Pour les Server Components, on peut utiliser fetch directement
    // Next.js résoudra automatiquement l'URL relative
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL 
      ? process.env.NEXT_PUBLIC_APP_URL 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: {
        revalidate: 60,
      },
    });
    
    if (!response.ok) {
      return { flags: DEFAULT_FLAGS, updatedAt: new Date().toISOString() };
    }
    
    const data = (await response.json()) as FeatureFlagsServerResponse;
    return {
      flags: data.flags ?? DEFAULT_FLAGS,
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return { flags: DEFAULT_FLAGS, updatedAt: new Date().toISOString() };
  }
}
```

**OU mieux** : Utiliser une approche plus simple avec fetch relatif (si Next.js le supporte) :

```typescript
export async function loadFeatureFlags(): Promise<{
  flags: Record<string, boolean>;
  updatedAt: string | null;
}> {
  try {
    // Dans Next.js 13+, fetch avec URL relative fonctionne dans Server Components
    // Mais il faut utiliser l'URL complète pour éviter les problèmes
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/feature-flags`, {
      cache: 'no-store', // Pas de cache pour éviter les problèmes
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return { flags: DEFAULT_FLAGS, updatedAt: new Date().toISOString() };
    }
    
    const data = (await response.json()) as FeatureFlagsServerResponse;
    return {
      flags: data.flags ?? DEFAULT_FLAGS,
      updatedAt: data.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    // En cas d'erreur, retourner les flags par défaut
    return { flags: DEFAULT_FLAGS, updatedAt: new Date().toISOString() };
  }
}
```

## 📝 Diagnostic Final

**Cause probable** : `loadFeatureFlags()` essaie de faire un fetch vers une URL externe depuis un Server Component, ce qui peut causer des problèmes de résolution DNS, de timeout, ou de connexion.

**Solution** : Corriger `loadFeatureFlags()` pour gérer correctement les erreurs ou utiliser une approche différente.

