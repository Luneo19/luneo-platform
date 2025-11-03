# 🚀 DÉPLOIEMENT MANUEL SUR VERCEL

**Alternative simple si CLI ne fonctionne pas**

---

## ✅ MÉTHODE SIMPLE (via Dashboard Vercel)

### Étape 1: Push sur GitHub (si pas déjà fait)

```bash
cd /Users/emmanuelabougadous/luneo-platform
git init
git add .
git commit -m "Production ready"
git remote add origin [votre-repo-github]
git push -u origin main
```

### Étape 2: Connecter Vercel au Repo

1. Aller sur https://vercel.com/dashboard
2. Cliquer "+ Add New..." → "Project"
3. Sélectionner votre repo GitHub
4. Vercel va builder automatiquement

---

## ✅ MÉTHODE ALTERNATIVE (Upload Direct)

Vercel CLI pose problème ? Utilisons le Dashboard:

### Via Dashboard Vercel

1. Aller sur https://vercel.com/luneos-projects/frontend
2. Onglet "Deployments"
3. Déjà déployé ? → Cliquer "Redeploy" sur le dernier
4. Vérifier "Use existing Build Cache" est décoché
5. Cliquer "Redeploy"

Vercel va rebuild depuis zéro et ça devrait marcher.

---

## ✅ TESTS

Une fois déployé, tester:

```
https://app.luneo.app/api/health
https://app.luneo.app/login
https://app.luneo.app/dashboard
```

---

**Alternative la plus simple: Utiliser le Dashboard Vercel au lieu de la CLI !** 🚀

