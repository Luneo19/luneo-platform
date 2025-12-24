# 🔓 GUIDE - DÉSACTIVER LA PROTECTION VERCEL

**Date** : 23 décembre 2025

---

## 🎯 PROBLÈME

L'application retourne **"Authentication Required"** au lieu du contenu, car Vercel protège le déploiement avec une authentification.

---

## ✅ SOLUTION : DÉSACTIVER LA PROTECTION

### Étape 1 : Accéder au Dashboard Vercel

1. Aller sur **https://vercel.com**
2. Se connecter avec votre compte
3. Sélectionner le projet **`luneo-frontend`**

---

### Étape 2 : Désactiver la Protection de Déploiement

1. Dans le projet, aller sur **Settings** (⚙️)
2. Dans le menu de gauche, cliquer sur **Deployment Protection**
3. Vérifier les options suivantes :

   **🔴 À DÉSACTIVER** :
   - ❌ **Password Protection** → Désactiver pour Production
   - ❌ **Vercel Authentication** → Désactiver pour Production
   - ❌ **Preview Protection** → Désactiver si activé

4. **Sauvegarder** les modifications

---

### Étape 3 : Vérifier les Domaines

1. Toujours dans **Settings**
2. Aller sur **Domains**
3. Vérifier que :
   - ✅ `luneo.app` est assigné au projet
   - ✅ `www.luneo.app` est assigné au projet
   - ✅ `app.luneo.app` est assigné au projet
   - ✅ Tous pointent vers **Production** (pas Preview)

---

### Étape 4 : Vérifier le Déploiement

1. Aller sur **Deployments**
2. Vérifier que le dernier déploiement est en **Production** (pas Preview)
3. Si nécessaire, promouvoir un déploiement en Production :
   - Cliquer sur le déploiement
   - Cliquer sur **"Promote to Production"**

---

## 🔍 VÉRIFICATION

Après désactivation de la protection :

```bash
curl -I https://luneo.app
```

**Résultat attendu** :
- ✅ `HTTP/2 200` → Application accessible
- ❌ `HTTP/2 401` → Protection encore active

---

## 📋 CHECKLIST

- [ ] Protection de déploiement désactivée pour Production
- [ ] Domaines correctement assignés
- [ ] Dernier déploiement en Production
- [ ] Test de l'application : `https://luneo.app` → 200 OK

---

## ⚠️ NOTE IMPORTANTE

La protection Vercel est utile pour les **preview deployments** mais doit être **désactivée pour la production** pour permettre l'accès public.

---

**✅ Suivez ces étapes pour désactiver la protection et rendre l'application accessible publiquement.**
