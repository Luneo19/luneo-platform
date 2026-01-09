# 🔍 Analyse Erreur 500 - Frontend Vercel

**Date** : 5 janvier 2026, 00:50

## 📊 Constat

- ✅ Build Vercel : Réussi
- ✅ Dernier déploiement : 23:56:42 (Status: Ready)
- ⚠️ Erreur 500 persistante au runtime

## 🔍 Analyse du Code

### 1. `layout.tsx` (Root Layout)

```typescript
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, messages, currency, timezone, availableLocales } = await loadI18nConfig();
  const featureFlags = await loadFeatureFlags();
  // ...
}
```

**Problème potentiel** : Deux appels asynchrones dans un Server Component :
1. `loadI18nConfig()` 
2. `loadFeatureFlags()`

Si l'un des deux échoue, l'erreur n'est pas catchée et provoque une erreur 500.

### 2. `loadFeatureFlags.ts`

```typescript
export async function loadFeatureFlags(): Promise<{
  flags: Record<string, boolean>;
  updatedAt: string | null;
}> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const endpoint = `${baseUrl}/api/feature-flags`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    // ...
  } catch (error) {
    return { flags: DEFAULT_FLAGS, updatedAt: new Date().toISOString() };
  }
}
```

**Problèmes potentiels** :

1. **`process.env.VERCEL_URL`** : Sur Vercel, cette variable peut être `undefined` ou contenir un hostname sans protocole. Utiliser `https://${process.env.VERCEL_URL}` peut créer une URL invalide.

2. **Fetch interne** : Faire un fetch vers sa propre API route depuis un Server Component peut causer des problèmes de résolution DNS ou de timeout, même avec un timeout de 3 secondes.

3. **AbortController** : Si `clearTimeout(timeoutId)` n'est pas appelé avant le timeout, cela peut causer des problèmes.

## 🎯 Solution Recommandée

### Option 1 : Simplifier `loadFeatureFlags` (Recommandé)

Ne pas faire de fetch, retourner directement les flags par défaut ou les charger depuis les variables d'environnement :

```typescript
export async function loadFeatureFlags(): Promise<{
  flags: Record<string, boolean>;
  updatedAt: string | null;
}> {
  // Charger depuis les variables d'environnement directement
  // Pas de fetch HTTP
  return { flags: DEFAULT_FLAGS, updatedAt: new Date().toISOString() };
}
```

### Option 2 : Améliorer la gestion d'erreur dans `layout.tsx`

```typescript
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let i18nConfig, featureFlags;
  
  try {
    i18nConfig = await loadI18nConfig();
  } catch (error) {
    // Fallback
    i18nConfig = { locale: 'en', messages: {}, currency: 'USD', timezone: 'UTC', availableLocales: [] };
  }
  
  try {
    featureFlags = await loadFeatureFlags();
  } catch (error) {
    // Fallback
    featureFlags = { flags: DEFAULT_FLAGS, updatedAt: new Date().toISOString() };
  }
  
  // ...
}
```

### Option 3 : Corriger `loadFeatureFlags` pour utiliser la bonne URL

```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';
// Ne pas utiliser VERCEL_URL car il peut être undefined ou incorrect
```

## 🔧 Action Immédiate

**Solution la plus simple** : Simplifier `loadFeatureFlags` pour ne pas faire de fetch, retourner directement les flags par défaut.

**Avantages** :
- Pas de dépendance réseau
- Pas de timeout
- Pas de problème de résolution DNS
- Plus rapide
- Plus fiable




