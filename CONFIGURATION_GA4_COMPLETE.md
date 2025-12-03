# ✅ CONFIGURATION GA4 COMPLÈTE

## 🎉 CONFIGURATION TERMINÉE

### ✅ Variables d'environnement Vercel
- ✅ `NEXT_PUBLIC_SENTRY_DSN` : Production, Preview, Development
- ✅ `NEXT_PUBLIC_GA_ID` : Production, Preview (valeur: `G-BDF4K1YYEF`)

### ✅ Code intégré
- ✅ Composant `GoogleAnalytics.tsx` mis à jour avec le Measurement ID
- ✅ Intégré dans `layout.tsx`
- ✅ Script gtag.js configuré correctement

### ✅ Informations GA4
- **Measurement ID**: `G-BDF4K1YYEF`
- **Nom du flux**: Luneo production
- **URL de flux**: https://www.luneo.app
- **ID de flux**: 13074635649

---

## 🧪 TESTER LA CONFIGURATION

### Option 1 : Page de test locale
1. Démarrer le serveur de développement :
   ```bash
   cd apps/frontend
   pnpm dev
   ```
2. Aller sur : http://localhost:3000/test-ga4.html
3. Vérifier que tous les tests passent

### Option 2 : Vérifier dans le navigateur
1. Aller sur https://luneo.app (ou votre URL de production)
2. Ouvrir DevTools (F12)
3. Onglet **Network** → Filtrer par `google-analytics` ou `gtag`
4. Vous devriez voir des requêtes vers `www.googletagmanager.com`
5. Onglet **Console** → Taper `window.gtag` → Devrait afficher une fonction
6. Taper `window.dataLayer` → Devrait afficher un tableau

### Option 3 : Google Analytics Realtime
1. Aller sur https://analytics.google.com/
2. Sélectionner votre propriété "Luneo Platform"
3. Aller dans **Realtime** → **Overview**
4. Visiter votre site → Vous devriez voir votre visite apparaître en temps réel

---

## 📊 ÉVÉNEMENTS TRACKÉS

Le composant `GoogleAnalytics.tsx` track automatiquement :
- ✅ **Page views** : À chaque changement de route
- ✅ **Custom events** : Via `trackEvent()`
- ✅ **Conversions** : Via `trackConversion()`

### Utilisation dans le code

```typescript
import { trackEvent, trackConversion } from '@/components/GoogleAnalytics';

// Track un événement personnalisé
trackEvent('button_click', 'engagement', 'header_cta', 1);

// Track une conversion (achat)
trackConversion('order-123', 99.99, 'EUR');
```

---

## 🔧 CONFIGURATION GA4 AVANCÉE

### Configurer les événements dans GA4

1. Aller sur https://analytics.google.com/
2. **Admin** → **Events**
3. Créer des événements personnalisés si nécessaire

### Configurer les conversions

1. **Admin** → **Events**
2. Activer les événements comme conversions :
   - `purchase` (déjà configuré dans le code)
   - Autres événements selon vos besoins

### Configurer les audiences

1. **Admin** → **Audiences**
2. Créer des audiences personnalisées :
   - Utilisateurs ayant effectué un achat
   - Utilisateurs ayant visité la page pricing
   - etc.

---

## 🚀 REDÉPLOIEMENT

Pour activer les nouvelles variables dans Vercel :

```bash
cd apps/frontend
vercel --prod
```

**OU** via l'interface Vercel :
1. Aller sur : https://vercel.com/luneos-projects/frontend/deployments
2. Cliquer sur **"Redeploy"** sur le dernier déploiement

---

## ✅ VÉRIFICATION FINALE

### Checklist
- [x] Variable `NEXT_PUBLIC_GA_ID` ajoutée dans Vercel
- [x] Composant GoogleAnalytics mis à jour
- [x] Script gtag.js intégré dans layout.tsx
- [x] Page de test créée (`/test-ga4.html`)
- [ ] Redéployer sur Vercel
- [ ] Vérifier dans GA4 Realtime
- [ ] Tester les événements personnalisés

---

## 📝 NOTES

- Le Measurement ID est hardcodé en fallback dans le composant (`G-BDF4K1YYEF`)
- Les événements sont trackés automatiquement lors des changements de route
- Le DataLayer est initialisé automatiquement
- Les conversions sont trackées via la fonction `trackConversion()`

---

## 🆘 DÉPANNAGE

### GA4 ne fonctionne pas ?
1. Vérifier que `NEXT_PUBLIC_GA_ID` est bien défini dans Vercel
2. Vérifier la console du navigateur pour les erreurs
3. Vérifier le Network tab pour les requêtes vers Google Analytics
4. Vérifier que le cookie banner n'bloque pas le tracking (si applicable)

### Les événements n'apparaissent pas ?
1. Attendre quelques minutes (délai de traitement GA4)
2. Vérifier dans GA4 → **Realtime** → **Events**
3. Vérifier que les événements sont bien envoyés via `window.gtag`

---

**Configuration terminée le** : $(date)
**Measurement ID** : G-BDF4K1YYEF
**Status** : ✅ Prêt pour production


